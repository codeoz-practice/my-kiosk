import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../user/user.repository';
import {
  DomainNotFoundError,
  DomainUnauthorizedError,
} from 'src/common/errors';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  async register(email: string, password: string) {
    // 일반 회원가입은 항상 USER 역할로 생성한다. OWNER/MANAGER는 별도 절차로 생성한다.
    await this.userService.create(email, password, UserRole.USER);

    // 사용자 생성 후 바로 로그인 처리
    return await this.login(email, password);
  }

  async login(email: string, plainPassword: string) {
    const user = await this.userService.validateUser(email, plainPassword);

    // JWT 토큰 생성
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role, jti: randomUUID() };

    const [accessToken, refreshToken] = await Promise.all([
      // Access Token (15분)
      this.jwtService.signAsync(
        { ...payload, type: 'access' },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      // Refresh Token (7일)
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  /**
   * @description Refresh Token 유효성은 JwtRefreshAuthGuard에서 검증한다.
   * @param userId
   */
  async refreshAccessToken(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new DomainNotFoundError('사용자를 찾을 수 없습니다');

    if (!user.isActive)
      throw new DomainUnauthorizedError('비활성화된 계정입니다');

    return this.generateTokens(user.id, user.email, user.role);
  }
}
