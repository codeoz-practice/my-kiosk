import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  JwtPayload,
  JwtValidationResult,
} from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  validate(payload: JwtPayload): JwtValidationResult {
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('유효하지 않은 토큰 타입입니다');
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
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
