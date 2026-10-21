import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';

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
      payload = await this.jwtService.verifyAsync<RefreshPayload>(
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
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is not available');
    }

    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
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
      throw new UnauthorizedException('Refresh token is not valid');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedTokenId },
      data: { revokedAt: new Date() },
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

      const refreshTokens = await this.prisma.refreshToken.findMany({
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
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    } catch {
      // Logout должен быть идемпотентным.
    }

    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
    },
  ) {
    const updateData: {
      firstName?: string;
      lastName?: string;
    } = {};

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName.trim();
    }

    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName.trim();
    }

    if (
      (updateData.firstName !== undefined &&
        updateData.firstName.length < 2) ||
      (updateData.lastName !== undefined &&
        updateData.lastName.length < 2)
    ) {
      throw new UnauthorizedException(
        'Name must contain at least 2 characters',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Current password is incorrect',
      );
    }

    if (currentPassword === newPassword) {
      throw new ConflictException(
        'New password must differ from the current password',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
      },
    });
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

    const accessToken = await this.jwtService.signAsync(
      accessPayload,
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      refreshPayload,
      {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          process.env.JWT_SECRET,
        expiresIn: '30d',
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
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

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Не раскрываем, зарегистрирован ли этот email.
    const response = {
      message:
        'Если аккаунт с таким email существует, инструкция по восстановлению будет отправлена.',
    };

    if (!user || !user.isActive) {
      return response;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const webUrl = process.env.APP_WEB_URL;

    if (!webUrl) {
      await this.prisma.passwordResetToken.deleteMany({
        where: { tokenHash },
      });

      throw new ServiceUnavailableException(
        'Не настроен адрес веб-приложения',
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || '127.0.0.1',
      port: Number(process.env.MAIL_PORT || 1025),
      secure: false,
    });

    const resetUrl =
      `${webUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || 'PortalClints <noreply@portalclints.local>',
        to: user.email,
        subject: 'Восстановление пароля PortalClints',
        text: [
          'Вы запросили восстановление пароля.',
          '',
          `Перейдите по ссылке: ${resetUrl}`,
          '',
          'Ссылка действует 30 минут.',
          'Если вы не запрашивали восстановление, проигнорируйте письмо.',
        ].join('\n'),
        html: `
        <p>Вы запросили восстановление пароля.</p>
        <p><a href="${resetUrl}">Создать новый пароль</a></p>
        <p>Ссылка действует 30 минут.</p>
        <p>Если вы не запрашивали восстановление, проигнорируйте письмо.</p>
      `,
      });
    } catch {
      await this.prisma.passwordResetToken.deleteMany({
        where: { tokenHash },
      });

      throw new ServiceUnavailableException(
        'Не удалось отправить письмо. Попробуйте позже.',
      );
    }

    return response;
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    const now = new Date();

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= now
    ) {
      throw new UnauthorizedException(
        'Ссылка недействительна или срок её действия истёк.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      // Одноразовое использование токена, включая параллельные запросы.
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claimed.count !== 1) {
        throw new UnauthorizedException(
          'Ссылка недействительна или срок её действия истёк.',
        );
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      // Завершаем активные сессии после смены пароля.
      await tx.refreshToken.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: { revokedAt: now },
      });

      // Удаляем остальные токены восстановления этого пользователя.
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
        },
      });
    });

    return { message: 'Пароль успешно изменён.' };
  }

}

