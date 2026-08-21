import { Injectable } from '@nestjs/common';
import { SeatRepository } from './seat.repository';
import { GetSeatOutDto } from './dto/get-seat-out.dto';

@Injectable()
export class SeatService {
  constructor(private readonly repository: SeatRepository) {}

  async getSeat(shopId: string): Promise<GetSeatOutDto[]> {
    const seats = await this.repository.getSeat(shopId);

    return seats.map((seat) => ({
      id: seat.id,
      number: seat.number,
      name: seat.name,
      usageSession: seat.usageSession.map((session) => ({
        id: session.id,
        status: session.status,
        startedAt: session.startedAt,
        plannedEndAt: session.plannedEndAt,
        endedAt: session.endedAt,
      })),
    }));
  }

  async createSeat(
    shopId: string,
    name?: string,
    number?: number,
  ): Promise<void> {
    // 좌석 번호가 없으면 마지막 좌석 번호 다음 값으로 채운다.
    const newSeatNumber = number
      ? number
      : (await this.repository.getLastSeatNumber(shopId)) + 1;

    await this.repository.createSeat({
      number: newSeatNumber,
      name,
      shop: {
        connect: { id: shopId },
      },
    });
  }

  // 배석 / 배석 해제는 usageSession에 의해서 이루어 진다.

  async updateSeat(
    seatId: string,
    data: { name?: string; number?: number },
  ): Promise<void> {
    await this.repository.updateSeat(seatId, data);
  }

  async deleteSeat(seatId: string): Promise<void> {
    await this.repository.deleteSeat(seatId);
  }
}
