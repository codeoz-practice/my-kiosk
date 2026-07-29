import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateShopDto {
  @IsString()
  @MaxLength(100, { message: '매장 이름은 100자 이하여야 합니다'})
  @IsNotEmpty({ message: '매장 이름은 필수입니다'})
  name: string;

  @IsString()
  @MaxLength(100, { message: '아이디는 100자 이하여야 합니다'})
  @IsNotEmpty({ message: '아이디는 필수입니다'})
  ownerId: string;
}