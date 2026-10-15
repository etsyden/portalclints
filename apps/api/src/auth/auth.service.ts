import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface RefreshPayload {
  sub: string;
  email: string;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
    });

    return this.createAuthResponse(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: RefreshPayload;

    try {
      payload =
        await this.jwtService.verifyAsync<RefreshPayload>(
          refreshToken,
          {
            secret:
              process.env.JWT_REFRESH_SECRET ||
              process.env.JWT_SECRET,
          },
        );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'User is not available',
      );
    }

    const refreshTokens =
      await this.prisma.refreshToken.findMany({
        where: {
          userId: user.id,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

    let storedTokenId: string | null = null;

    for (const storedToken of refreshTokens) {
      const matches = await bcrypt.compare(
        refreshToken,
        storedToken.tokenHash,
      );

      if (matches) {
        storedTokenId = storedToken.id;
        break;
      }
    }

    if (!storedTokenId) {
      throw new UnauthorizedException(
        'Refresh token is not valid',
      );
    }

    await this.prisma.refreshToken.update({
      where: {
        id: storedTokenId,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return this.createAuthResponse(user);
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return { success: true };
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<RefreshPayload>(
          refreshToken,
          {
            secret:
              process.env.JWT_REFRESH_SECRET ||
              process.env.JWT_SECRET,
          },
        );

      const refreshTokens =
        await this.prisma.refreshToken.findMany({
          where: {
            userId: payload.sub,
            revokedAt: null,
          },
        });

      for (const storedToken of refreshTokens) {
        const matches = await bcrypt.compare(
          refreshToken,
          storedToken.tokenHash,
        );

        if (matches) {
          await this.prisma.refreshToken.update({
            where: {
              id: storedToken.id,
            },
            data: {
              revokedAt: new Date(),
            },
          });

          break;
        }
      }
    } catch {
      // Logout должен быть идемпотентным.
    }

    return { success: true };
  }

  private async createAuthResponse(user: AuthUser) {
    const accessPayload = {
      sub: user.id,
      email: user.email,
      type: 'access' as const,
    };

    const refreshPayload: RefreshPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    const accessToken =
      await this.jwtService.signAsync(accessPayload, {
        secret:
        process.env.JWT_SECRET,
        expiresIn: '15m',
      });

    const refreshToken =
      await this.jwtService.signAsync(refreshPayload, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          process.env.JWT_SECRET,
        expiresIn: '30d',
      });

    const tokenHash = await bcrypt.hash(
      refreshToken,
      12,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(
          Date.now() +
          30 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}