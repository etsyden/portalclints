import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const jwtService = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn(),
  } as unknown as JwtService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwtService);
  });

  describe('login', () => {
    it('rejects login when the user does not exist', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.login('missing@example.com', 'SomePassword123!'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rejects a revoked refresh token', async () => {
      jwtService.verifyAsync = jest.fn().mockResolvedValue({
        sub: 'user-id',
        email: 'user@example.com',
        type: 'refresh',
      });

      prisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      });

      prisma.refreshToken.findMany = jest.fn().mockResolvedValue([]);

      await expect(
        service.refresh('previously-revoked-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });

    it('rejects an empty refresh token', async () => {
      await expect(service.refresh('')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('rejects an unknown reset token', async () => {
      prisma.passwordResetToken.findUnique = jest
        .fn()
        .mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'NewPassword123!'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects an expired reset token', async () => {
      prisma.passwordResetToken.findUnique = jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'user-id',
        usedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(
        service.resetPassword('expired-token', 'NewPassword123!'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a reset token that has already been used', async () => {
      prisma.passwordResetToken.findUnique = jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'user-id',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.resetPassword('used-token', 'NewPassword123!'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('updates the password and revokes active refresh tokens', async () => {
      prisma.passwordResetToken.findUnique = jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'user-id',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      const tx = {
        passwordResetToken: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        user: {
          update: jest.fn().mockResolvedValue({}),
        },
        refreshToken: {
          updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      };

      (prisma as any).$transaction = jest.fn(
        async (callback: (tx: any) => Promise<unknown>) => callback(tx),
      );

      await expect(
        service.resetPassword('valid-token', 'NewPassword123!'),
      ).resolves.toEqual({ message: 'Пароль успешно изменён.' });

      expect(tx.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'reset-token-id',
          usedAt: null,
          expiresAt: expect.objectContaining({ gt: expect.any(Date) }),
        },
        data: { usedAt: expect.any(Date) },
      });

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { passwordHash: expect.any(String) },
      });

      expect(tx.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });

      expect(tx.passwordResetToken.deleteMany).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});

