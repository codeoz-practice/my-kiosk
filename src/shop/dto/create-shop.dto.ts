import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateShopDto {
  @ApiProperty({ description: '매장 이름', example: '테스트 매장' })
  @IsString()
  @MaxLength(100, { message: '매장 이름은 100자 이하여야 합니다' })
  @IsNotEmpty({ message: '매장 이름은 필수입니다' })
  name: string;

  @ApiProperty({
    description: '점주 아이디',
    example: 'be5588fb-ee29-47c3-8582-062bb3ab365c',
  })
  @IsString()
  @MaxLength(100, { message: '아이디는 100자 이하여야 합니다' })
  @IsNotEmpty({ message: '아이디는 필수입니다' })
  ownerId: string;
}
