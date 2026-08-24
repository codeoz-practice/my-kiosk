import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ description: '이메일', required: true })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: '암호', required: true })
  @IsStrongPassword(
    {
      minLength: 5,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        '암호는 최소 5자리, 대문자/소문자/숫자/심볼 1자 이상이어야 합니다',
    },
  )
  password!: string;
}
