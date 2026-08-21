import { ApiProperty } from '@nestjs/swagger';
import { UsageSessionOutDto } from 'src/usage-session/dto/usage-session-out.dto';

export class GetSeatOutDto {
  @ApiProperty({ description: '좌석 아이디' })
  id!: string;

  @ApiProperty({ description: '좌석 번호' })
  number!: number;

  @ApiProperty({ description: '좌석 이름' })
  name!: string;

  @ApiProperty({
    description: '현재 좌석의 이용 세션 목록',
    type: [UsageSessionOutDto],
  })
  usageSession!: UsageSessionOutDto[];
}
