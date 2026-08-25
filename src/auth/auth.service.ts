import { Injectable, UnauthorizedException } from '@nestjs/common';
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
import { assertDefined } from 'src/common/utils/assert.util';

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
    const { tokens, jti, refreshTokenExpiresIn } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    await this.userRepository.createRefreshToken(
      user.id,
      jti,
      refreshTokenExpiresIn,
    );

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async logout(jti: string) {
    await this.userRepository.deleteRefreshTokenByJti(jti);
  }

  async generateTokens(userId: string, email: string, role: string) {
    const refreshExpiresDays = this.configService.get<number>(
      'JWT_REFRESH_EXPIRES_DAYS',
    );
    assertDefined(refreshExpiresDays, 'refresh token 만료일 미설정');

    const refreshTokenExpiresIn = new Date(
      Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000,
    );
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
        {
          ...payload,
          type: 'refresh',
          exp: Math.floor(refreshTokenExpiresIn.getTime() / 1000),
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      ),
    ]);
    return {
      tokens: { accessToken, refreshToken },
      jti: payload.jti,
      refreshTokenExpiresIn,
    };
  }

  /**
   * @description Refresh Token 유효성은 JwtRefreshAuthGuard에서 검증한다.
   * @param userId
   */
  async refreshAccessToken(userId: string, jti: string) {
    const refreshExpiresDays = this.configService.get<number>(
      'JWT_REFRESH_EXPIRES_DAYS',
    );
    assertDefined(refreshExpiresDays, 'refresh token 만료일 미설정');

    const user = await this.userRepository.findById(userId);
    if (!user) throw new DomainNotFoundError('사용자를 찾을 수 없습니다');

    if (!user.isActive)
      throw new DomainUnauthorizedError('비활성화된 계정입니다');

    // "서명은 유효한데 DB에 jti가 없다" = 탈취 감지 상황
    // 사용자의 모든 리플래시 토큰 디비에서 제거
    const refreshToken = await this.userRepository.findRefreshTokenJti(jti);
    if (!refreshToken) {
      await this.userRepository.deleteAllRefreshTokenByUserId(user.id);
      throw new DomainUnauthorizedError(
        '비정상 접근이 감지되어 모든 세션을 종료합니다',
      );
    }

    const { tokens, jti: newJti } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    // 기존 리플래시 토큰 삭제
    await this.userRepository.deleteRefreshTokenByJti(jti);

    // 새로운 리플래시 토큰 등록
    await this.userRepository.createRefreshToken(
      user.id,
      newJti,
      new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000),
    );
    return tokens;
  }
}
