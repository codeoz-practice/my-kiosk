import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PauseTicketDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
