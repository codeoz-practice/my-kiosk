import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { handleJwtRequest } from './jwt-handle-request';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  // 요청이 Guard에 도달했을 때 (가장 먼저) - 인증 절차를 탈지 말지 라우팅 결정
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  // passport strategy의 validate() 실행이 끝난 직후
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    return handleJwtRequest<TUser>(err, user, info);
  }
}
