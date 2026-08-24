import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enum/role.enum';
import { JwtValidationResult } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Roles() 없으면 역할 제한 없음
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user: JwtValidationResult }>();
    const user = request.user;

    if (!user)
      throw new UnauthorizedException('사용자 인증 정보를 찾을 수  없습니다');
    if (!user.role)
      throw new UnauthorizedException('사용자 역할 정보를 찾을 수 없습니다');
    if (!requiredRoles.includes(user.role as Role))
      throw new UnauthorizedException('이 작업을 수행할 권한이 없습니다');
    return true;
  }
}
