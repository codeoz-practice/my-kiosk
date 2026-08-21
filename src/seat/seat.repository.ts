import { Get, Injectable } from '@nestjs/common';
import { Prisma, Seat } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SeatRepository {
  constructor(private readonly prisma: PrismaService) {}

  // 매장별 좌석 조회
  async getSeat(
    shopId: string,
  ): Promise<Prisma.SeatGetPayload<{ include: { usageSession: true } }>[]> {
    return await this.prisma.seat.findMany({
      where: {
        shopId,
      },
      include: {
        usageSession: true,
      },
    });
  }

  // 좌석 등록
  async createSeat(data: Prisma.SeatCreateInput): Promise<void> {
    await this.prisma.seat.create({
      data,
    });
  }

  // 좌석 정보 업데이트
  async updateSeat(
    seatId: string,
    data: Omit<Prisma.SeatUpdateInput, 'id'>,
  ): Promise<void> {
    await this.prisma.seat.update({
      where: {
        id: seatId,
      },
      data,
    });
  }

  // 좌석 삭제
  async deleteSeat(seatId: string): Promise<void> {
    await this.prisma.seat.delete({
      where: {
        id: seatId,
      },
    });
  }

  // 마지막 좌석 번호 조회
  async getLastSeatNumber(shopId: string): Promise<number> {
    const seat = await this.prisma.seat.findFirst({
      where: {
        shopId,
      },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    return seat?.number ?? 0;
  }
}
