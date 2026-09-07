import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TicketStatus, TicketType } from '@prisma/client';
import { TicketPauseRepository } from './ticket-pause.repository';
import { SessionLifecycleService } from 'src/session-lifecycle/session-lifecycle.service';
import { DomainBadRequestError, DomainConflictError } from 'src/common/errors';
import { assertDefined } from 'src/common/utils/assert.util';

@Injectable()
export class TicketPauseService {
  constructor(
    private readonly ticketPauseRepository: TicketPauseRepository,
    private readonly sessionLifecycle: SessionLifecycleService,
    @InjectQueue('usage-session') private readonly usageSessionQueue: Queue,
  ) {}

  /**
   * 이용권을 일시정지한다.
   * - ACTIVE 상태의 티켓만 정지 가능
   * - 진행 중인 UsageSession이 있으면 SessionLifecycleService를 통해 강제 종료
   * - 시간권: 세션 종료 시 소비 시간을 remainingMinutes에서 차감
   * - 정기권: 세션 종료만 (시간 차감 없음)
   * @param ticketId 정지할 티켓 ID
   * @param pausedBy 정지를 요청한 주체 (userId 또는 'SYSTEM')
   * @param reason 정지 사유 (선택)
   */
  async pauseTicket(
    ticketId: string,
    pausedBy: string,
    reason?: string,
  ): Promise<void> {
    const now = new Date();

    const { bullmqJobId } = await this.ticketPauseRepository.runInTransaction(
      async (tx) => {
        // 1. 티켓 조회 (FOR UPDATE — 동시 정지/재개 직렬화)
        const ticket = await this.ticketPauseRepository.getTicketForUpdate(
          ticketId,
          tx,
        );

        // 2. 정지 가능 상태 검증
        // > UNUSED 상태에서는 minuteExpireDeadline도 expiresAt도 아직 설정되지 않으므로, 재개 시 연장할 기한 자체가 없으므로 ACTIVE 만
        if (ticket.status !== TicketStatus.ACTIVE) {
          throw new DomainBadRequestError(
            `정지할 수 없는 상태의 티켓입니다 (현재: ${ticket.status})`,
          );
        }

        // 3. 이미 정지 중인지 확인 (partial unique index가 1차 방어, 여기서 의미 있는 에러 제공)
        const activePause = await this.ticketPauseRepository.findActivePause(
          ticketId,
          tx,
        );
        if (activePause) {
          throw new DomainConflictError('이미 정지 중인 티켓입니다');
        }

        // 4. 진행 중인 세션이 있으면 종료 (SessionLifecycleService 위임)
        let sessionJobId: string | null = null;
        const activeSessionId =
          await this.ticketPauseRepository.findActiveSessionId(ticketId, tx);

        if (activeSessionId) {
          const result = await this.sessionLifecycle.endSession(
            activeSessionId,
            now,
            tx,
          );
          sessionJobId = result.bullmqJobId;
        }

        // 5. TicketPause 생성
        await this.ticketPauseRepository.createPause(
          {
            ticketId,
            pausedAt: now,
            pausedReason: reason,
            pausedBy,
          },
          tx,
        );

        return { bullmqJobId: sessionJobId };
      },
    );

    // 6. 트랜잭션 성공 후 BullMQ 자동만료 Job 제거
    //    실패해도 endSession의 멱등 로직이 이중 종료를 방지한다
    if (bullmqJobId) {
      await this.usageSessionQueue.remove(bullmqJobId).catch(() => {});
    }
  }

  /**
   * 정지된 이용권을 재개한다.
   * - 활성 TicketPause가 있어야 재개 가능
   * - 정지 기간만큼 기한을 연장한다
   *   - 시간권: minuteExpireDeadline += 정지 기간
   *   - 정기권: expiresAt += 정지 기간
   * - 재개 ≠ 재입실 (새 UsageSession을 만들지 않는다)
   * @param ticketId 재개할 티켓 ID
   * @param resumedBy 재개를 요청한 주체 (userId 또는 'SYSTEM')
   * @param reason 재개 사유 (선택)
   */
  async resumeTicket(
    ticketId: string,
    resumedBy: string,
    reason?: string,
  ): Promise<void> {
    const now = new Date();

    await this.ticketPauseRepository.runInTransaction(async (tx) => {
      // 1. 티켓 조회 (FOR UPDATE)
      const ticket = await this.ticketPauseRepository.getTicketForUpdate(
        ticketId,
        tx,
      );

      // 2. 활성 TicketPause 존재 확인
      const activePause = await this.ticketPauseRepository.findActivePause(
        ticketId,
        tx,
      );
      if (!activePause) {
        throw new DomainBadRequestError('정지 상태가 아닌 티켓입니다');
      }

      // 3. 정지 중에 REVOKED 등으로 전이된 경우 재개 불가
      // > UNUSED 상태는 정지 대상이 아니다
      if (ticket.status !== TicketStatus.ACTIVE) {
        throw new DomainBadRequestError(
          `재개할 수 없는 상태의 티켓입니다 (현재: ${ticket.status})`,
        );
      }

      // 4. TicketPause 재개
      await this.ticketPauseRepository.resumePause(
        activePause.id,
        {
          resumedAt: now,
          resumedReason: reason,
          resumedBy,
        },
        tx,
      );

      // 5. 정지 기간만큼 기한 연장
      const pauseDurationMs = now.getTime() - activePause.pausedAt.getTime();

      if (ticket.type === TicketType.TIME) {
        assertDefined(
          ticket.minuteExpireDeadline,
          '시간권에 minuteExpireDeadline이 없습니다',
        );
        await this.ticketPauseRepository.extendTicketDeadline(
          ticketId,
          {
            minuteExpireDeadline: new Date(
              ticket.minuteExpireDeadline.getTime() + pauseDurationMs,
            ),
          },
          tx,
        );
      } else if (ticket.type === TicketType.PERIOD) {
        assertDefined(ticket.expiresAt, '정기권에 expiresAt이 없습니다');
        await this.ticketPauseRepository.extendTicketDeadline(
          ticketId,
          {
            expiresAt: new Date(ticket.expiresAt.getTime() + pauseDurationMs),
          },
          tx,
        );
      }
    });
  }
}
