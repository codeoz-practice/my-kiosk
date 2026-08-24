import { UnauthorizedException } from '@nestjs/common';

/**
 * JwtAuthGuard/JwtRefreshAuthGuard가 공유하는 handleRequest 로직.
 * passport strategy의 validate() 실행 직후 결과를 처리한다.
 */
export function handleJwtRequest<TUser = any>(
  err: any,
  user: any,
  info: any,
): TUser {
  if (err || !user) {
    if (info instanceof Error) throw new UnauthorizedException(info.message);
    throw err || new UnauthorizedException('인증에 실패했습니다');
  }
  return user;
}
