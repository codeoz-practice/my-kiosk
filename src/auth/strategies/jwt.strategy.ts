import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  JwtPayload,
  JwtValidationResult,
} from '../interfaces/jwt-payload.interface';
import { RedisService } from 'src/database/redis/redis.service';
import { RedisKeys } from 'src/database/redis/redis-keys';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // JWT_SECRET은 validation.schema.ts에서 필수(required)로 검증되므로
      // 앱 기동을 통과했다면 반드시 존재한다.
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtValidationResult> {
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('유효하지 않은 토큰 타입입니다');
    }

    if (
      !payload.sub ||
      !payload.email ||
      !payload.role ||
      !payload.exp ||
      !payload.jti ||
      !payload.iat
    ) {
      throw new UnauthorizedException('토큰 필수 정보가 누락되었습니다');
    }

    const revokedAt = await this.redisService.get(
      RedisKeys.sessionRevoked(payload.sub),
    );

    // 세션 취소 이전 발급된 토큰은 연결을 제한한다
    if (this.isRevokedToken(payload.iat, revokedAt)) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      exp: payload.exp,
    };
  }

  /**
   * 토큰 발급 시간이 세션 취소 시간보다 이전인지 확인한다.
   * @param iat 토큰 발급 시간 (Unix timestamp, 초)
   * @param revokedAt Redis에 기록된 세션 취소 시간 (ms 문자열), 없으면 null
   * @returns 취소된 토큰이면 true
   */
  isRevokedToken(iat: number, revokedAt: string | null) {
    if (!revokedAt) return false;
    return iat * 1000 < Number(revokedAt);
  }
}
