import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, RefreshToken, User, UserRole } from '@prisma/client';
import { DomainConflictError } from 'src/common/errors';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    email: string,
    passwordHash: string,
    role: UserRole,
  ): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          email,
          password: passwordHash,
          role: role,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DomainConflictError(`사용자 등록에 실패했습니다: ${email}`);
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return await this.prisma.user.findFirst({
      where: { id },
      select: {
        id: true,
        email: true,
        isActive: true,
        role: true,
      },
    });
  }

  async createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken> {
    return await this.prisma.refreshToken.findFirstOrThrow({
      where: {
        tokenHash,
      },
    });
  }

  async deleteRefreshTokenByHash(tokenHash: string): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        tokenHash,
      },
    });
    return result.count;
  }
}
