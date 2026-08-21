import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SetActiveShopDto {
  @ApiProperty({ description: '활성화 플래그' })
  @IsBoolean()
  isActive!: boolean;
}
