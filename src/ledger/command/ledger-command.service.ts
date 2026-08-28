import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LedgerCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async settle(ledgerId: string): Promise<void> {
    // 정산을 위해 계산 로직이 있다면 여기서 진행해서 아래 updateMany와 같이 트랜잭션으로 묶어서 커밋하는게 맞지?
    const result = await this.prisma.ledger.updateMany({
      where: { id: ledgerId, status: 'RELEASABLE' },
      data: { status: 'SETTLED', settledAt: new Date() },
    });

    if (result.count === 0) {
      // where 조건에 안 걸린 이유가 "이미 정산 완료"인지, "애초에 정산 불가 상태"인지 구분한다.

      // 재시도로 두번째 요청이 온 경우 성공으로 취급해서 클라이언트가 헷갈리지 않게 한다.
      const ledger = await this.prisma.ledger.findUnique({
        where: { id: ledgerId },
      });
      if (ledger?.status === 'SETTLED') {
        return; // 이미 정산 완료 - 재시도된 요청으로 간주, 에러 아님
      }

      throw new ConflictException('정산 가능한 상태가 아닙니다');
    }
  }
}
