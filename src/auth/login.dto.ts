import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '이메일', required: true })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: '암호', required: true })
  @IsString()
  password!: string;
}
