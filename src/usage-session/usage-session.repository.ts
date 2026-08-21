import { UsageSession } from './../../node_modules/.prisma/client/index.d';
import { Injectable } from '@nestjs/common';
import {
  Prisma,
  SeatStatus,
  Ticket,
  TicketStatus,
  TicketType,
  UsageSessionStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SeatAlreadyOccupiedError } from './errors/seat-already-occupied.error';
import { JobRegistrationFailedError } from './errors/job-registration-failed.error';
import { assertDefined } from 'src/common/utils/assert.util';
import { UsageSessionNotFoundError } from './errors/usage-session-not-found.error';

@Injectable()
export class UsageSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    ticketId: string,
    shopId: string,
    seatId: string,
    userId: string,
    plannedEndAt: Date, // ⭐️ 남은 시간
    startedAt: Date,
    updatePeriodTicketData?: {
      activatedAt: Date; // 첫 입장(활성화) 시각
      expiresAt: Date; // ⭐️ 정기권 실제 만료 시각(activatedAt + purchasedDurationDays)
    },
  ): Promise<string> {
    return await this.prisma.executeTransaction(async (tx) => {
      // Step 1. 좌석 이용 가능 유무 확인 (AVAILABLE 상태이고 ACTIVE 세션 없음)
      const availableSeat = await tx.seat.findFirst({
        where: {
          id: seatId,
          status: SeatStatus.AVAILABLE,
          usageSession: {
            none: { status: UsageSessionStatus.ACTIVE },
          },
        },
      });
      if (!availableSeat) {
        throw new SeatAlreadyOccupiedError(seatId);
      }

      // Step 2. 미사용 기간권 업데이트
      if (updatePeriodTicketData) {
        await tx.ticket.update({
          where: {
            id: ticketId,
            status: TicketStatus.UNUSED,
          },
          data: {
            status: TicketStatus.ACTIVE,
            activatedAt: updatePeriodTicketData.activatedAt,
            expiresAt: updatePeriodTicketData.expiresAt,
          },
        });
      }

      // Step 3. 세션 생성
      const session = await tx.usageSession.create({
        data: {
          ticket: { connect: { id: ticketId } },
          shop: { connect: { id: shopId } },
          seat: { connect: { id: seatId } },
          user: { connect: { id: userId } },
          startedAt,
          plannedEndAt,
        },
      });
      return session.id;
    });
  }

  async registerJobId(sessionId: string, bullmqJobId: string): Promise<void> {
    try {
      await this.prisma.usageSession.update({
        where: { id: sessionId, status: TicketStatus.ACTIVE },
        data: { bullmqJobId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new JobRegistrationFailedError(sessionId);
      }
      throw error;
    }
  }

  async endUsageSession(
    sessionId: string,
    now: Date,
  ): Promise<{ bullmqJobId: string | null }> {
    return await this.prisma.executeTransaction(async (tx) => {
      const [session] = await tx.$queryRaw<
        {
          id: string;
          status: string;
          startedAt: Date;
          ticketId: string;
          bullmqJobId: string | null;
        }[]
      >`
        SELECT us.id, us.status, us."started_at" AS "startedAt",
               us."ticket_id" AS "ticketId", us."bullmqJobId"
          FROM usage_sessions us
          WHERE us.id = ${sessionId}
          FOR UPDATE`;

      if (!session) throw new UsageSessionNotFoundError(sessionId);
      // 이미 종료된 세션 - 멱등 처리 (BullMQ 자동만료와 수동 퇴실이 거의 동시에 들어온 경우)
      if (session.status !== UsageSessionStatus.ACTIVE) {
        return { bullmqJobId: session.bullmqJobId };
      }

      const endedAt = now;
      // 실제 소비한 시간을 '분 단위'로 정확히 계산 (반올림 정책에 따라 조정)
      const consumedMinutes = Math.ceil(
        (endedAt.getTime() - session.startedAt.getTime()) / 60000,
      );

      await tx.usageSession.update({
        where: { id: sessionId },
        data: { status: UsageSessionStatus.ENDED, endedAt },
      });

      // 이용권 잔여시간 차감 - 유일한 진실의 원천을 여기서 갱신
      await tx.$executeRaw`
        UPDATE tickets
        SET "remaining_minutes" = GREATEST(0, "remaining_minutes" - ${consumedMinutes}),
            status = CASE
              WHEN "remaining_minutes" - ${consumedMinutes} <= 0
              THEN ${TicketStatus.EXHAUSTED}
              ELSE status
            END
        WHERE id = ${session.ticketId}
      `;

      return { bullmqJobId: session.bullmqJobId };
    });
  }

  async failSession(
    sessionId: string,
    status: UsageSessionStatus,
    failureReason?: string,
  ): Promise<void> {
    await this.prisma.usageSession.update({
      where: { id: sessionId },
      data: { status, failureReason },
    });
  }

  async getUsageSession(id: string) {
    return await this.prisma.usageSession.findUnique({
      where: {
        id,
      },
      include: {
        ticket: true,
        shop: true,
        seat: true,
        user: { select: { id: true } },
      },
    });
  }

  async getUsageSessionByShop(
    shopId: string,
    sortOrder: Prisma.SortOrder = 'asc',
    limit: number = 10,
  ) {
    return await this.prisma.usageSession.findMany({
      where: {
        shopId,
      },
      select: {
        id: true,
        status: true,
        seat: { select: { id: true, number: true } },
        ticket: { select: { id: true, type: true, status: true } },
        shop: { select: { id: true, name: true } },
        user: { select: { id: true, email: true } },
      },
      orderBy: [{ createdAt: sortOrder }],
      take: limit,
    });
  }

  async getUsageSessionByUser(
    userId: string,
    sortOrder: Prisma.SortOrder = 'asc',
    limit: number = 10,
  ) {
    return await this.prisma.usageSession.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
        seat: { select: { id: true, number: true } },
        ticket: { select: { id: true, type: true, status: true } },
        shop: { select: { id: true, name: true } },
        user: { select: { id: true, email: true } },
      },
      orderBy: [{ createdAt: sortOrder }],
      take: limit,
    });
  }

  // ❌ delete: UsageSession은 사용 이력이기 때문에 삭제하면 안된다.
}
