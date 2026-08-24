import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtValidationResult } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtValidationResult | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: JwtValidationResult }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
