import { Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtValidationResult } from 'src/auth/interfaces/jwt-payload.interface';
import { Role } from 'src/auth/enum/role.enum';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async me(@CurrentUser('userId') userId: string) {
    return await this.userService.getUserById(userId);
  }

  /**
   * "모든 기기에서 로그아웃" 기능
   * 계정은 그대로 두고 현재 발급된 로그인 세션을 모두 강제로 끊는다.
   * 비밀번호 변경/유출 의심, 원격 강제 로그아웃, 권한 변경 후 재로그인 강제 등
   * 매장 단위 이용 제한(ShopBan)이나 계정 정지(isActive=false)와는 별개의 조치다.
   */
  @Post(':userId/sessions/revoke-all')
  async revokeAllSessions(
    @CurrentUser() actor: JwtValidationResult,
    @Param('userId') targetUserId: string,
  ) {
    await this.userService.revokeAllSessions(actor.userId, actor.role as Role, targetUserId);
  }
}
