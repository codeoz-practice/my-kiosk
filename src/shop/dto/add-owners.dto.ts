import { IsEmpty, IsUUID } from 'class-validator';

export class AddOwnersDto {
  @IsUUID('4', { message: '점주 ID는 유효한 UUID 형식이어야 합니다' })
  ownerId: string;
}
