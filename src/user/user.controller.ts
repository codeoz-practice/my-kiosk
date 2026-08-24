import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Role } from 'src/auth/enum/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('me')
  async me(@CurrentUser('userId') userId: string) {
    return await this.service.getUserById(userId);
  }
}
