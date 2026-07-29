import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SetActiveShopDto {
  @IsBoolean()
  isActive: boolean;
}
