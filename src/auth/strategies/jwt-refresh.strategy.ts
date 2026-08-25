import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  JwtPayload,
  JwtValidationResult,
} from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // JWT_REFRESH_SECRET은 validation.schema.ts에서 필수(required)로 검증되므로
      // 앱 기동을 통과했다면 반드시 존재한다.
      secretOrKey: configService.get<string>('jwt.refreshSecret')!,
    });
  }

  // jwt 검사 후 호출됨
  validate(payload: JwtPayload): JwtValidationResult {
    if (payload.type && payload.type !== 'refresh') {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    if (
      !payload.sub ||
      !payload.email ||
      !payload.role ||
      !payload.exp ||
      !payload.jti
    ) {
      throw new UnauthorizedException('토큰 필수 정보가 누락되었습니다');
    }

    return {
      userId: payload.sub, // 토큰 소유자 id
      email: payload.email,
      role: payload.role,
      jti: payload.jti, // 토큰 고유 id
      exp: payload.exp, // 토큰 만료 시간
    };
  }
}
