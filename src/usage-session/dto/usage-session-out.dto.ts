import { ApiProperty } from '@nestjs/swagger';
import { UsageSessionStatus } from '@prisma/client';

// 이용 세션 중 API 응답에 필요한 필드만 노출한다.
export class UsageSessionOutDto {
  @ApiProperty({ description: '이용 세션 아이디' })
  id: string;

  @ApiProperty({ description: '이용 세션 상태', enum: UsageSessionStatus })
  status: UsageSessionStatus;

  @ApiProperty({ description: '이용 시작 시각' })
  startedAt: Date;

  @ApiProperty({ description: '이용 예정 종료 시각' })
  plannedEndAt: Date;

  @ApiProperty({
    description: '실제 종료 시각',
    required: false,
    nullable: true,
  })
  endedAt: Date | null;
}
