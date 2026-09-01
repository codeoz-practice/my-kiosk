import { Injectable } from '@nestjs/common';
import {
  PaymentCancelFailureCode,
  PaymentCancelStatus as PrismaPaymentCancelStatus,
  RefundLock,
} from '@prisma/client';
import { RefundRepository } from './refund.repository';
import { PaymentCancelStatus, paymentCancelStatusMap } from './refund.types';
import {
  DomainConflictError,
  DomainForbiddenError,
  DomainNotFoundError,
} from 'src/common/errors';
import { TransactionLoggerService } from '../logger/transaction-logger.service';
import { PgService } from 'src/pg/pg.service';
import { PgCancelInquiryResult } from 'src/pg/pg.types';

@Injectable()
export class RefundService {
  constructor(
    private readonly refundRepository: RefundRepository,
    private readonly transactionLoggerService: TransactionLoggerService,
    private readonly pgService: PgService,
  ) {}

  async refund(userId: string, ticketId: string, refundAmount: number) {
    const now = new Date();
    const ticket = await this.refundRepository.getTicketById(ticketId);

    if (!ticket) {
      throw new DomainNotFoundError('티켓이 존재하지 않습니다');
    }
    if (!ticket.userId || userId === ticket.userId) {
      throw new DomainForbiddenError('자신의 티켓만 환불 가능합니다');
    }
    if (!ticket.orderItem?.id) {
      throw new DomainNotFoundError('주문 정보가 존재하지 않습니다');
    }

    const [payment] = ticket.orderItem.order.payments;
    if (!payment || !payment.id) {
      throw new DomainNotFoundError('결재 정보가 존재하지 않습니다');
    }

    // 1차 트랜잭션: 락 상태만 확인. 만료된 락이 있으면 아직 아무것도 변경하지 않고 정보만 확보한다.
    const staleLock = await this.refundRepository.runInTransaction(
      async (tx) => {
        const refundLock = await this.refundRepository.getRefundLock(
          ticket.orderItem.id,
          tx,
        );
        if (!refundLock) return null;
        if (refundLock.expiresAt > new Date()) {
          throw new DomainConflictError('환불 진행 중인 상품입니다');
        }
        return refundLock;
      },
    );

    // staleLock: "예전에 어떤 요청이 락을 잡았는데, TTL(1분) 안에 정상적으로 처리(성공/실패 확정)되지 못한 채 시간이 지나버린 상태"
    if (staleLock) {
      const alreadySucceeded = await this.settleStaleLock(
        ticket.orderItem.order.id,
        ticket.orderItem.id,
        userId,
        refundAmount,
        staleLock,
      );
      // 이전 건이 이미 PG에서 성공 처리된 것으로 확인됐다면, 새 환불을 만들지 않고 조용히 종료한다.
      if (alreadySucceeded) return;
    }

    // 환불 가능 금액 검사 -> 환불 진행 락(트랜잭션으로)
    const { paymentCancel } = await this.refundRepository.runInTransaction(
      async (tx) => {
        // 방어적 재확인 - settleStaleLock 이후에도 유효한 락이 남아있으면 다른 요청과 경합 중인 것
        const lockCheck = await this.refundRepository.getRefundLock(
          ticket.orderItem.id,
          tx,
        );
        if (lockCheck && lockCheck.expiresAt > new Date()) {
          throw new DomainConflictError('환불 진행 중인 상품입니다');
        }

        // 환불 가능 금액 계산
        const refund = await this.refundRepository.calculateRefundableAmount(
          ticket.orderItem.id,
          tx,
        );

        if (refundAmount > refund.refund_amount) {
          throw new DomainConflictError(
            '환불 요청 금액이 환불 가능 금액 보다 많습니다',
          );
        }

        const paymentCancel = await this.refundRepository.createPaymentCancel(
          refundAmount,
          payment.id,
          now,
          tx,
        );

        await this.refundRepository.createPaymentCancelItem(
          paymentCancel.id,
          ticket.orderItem.id,
          refundAmount,
          tx,
        );

        await this.refundRepository.createRefundLock(
          ticket.orderItem.id,
          paymentCancel.id,
          new Date(Date.now() + 1 * 60 * 1000),
          tx,
        );

        return {
          paymentCancel,
        };
      },
    );

    try {
      // TODO: PG사 API 호출
      // - 응답은 완료 콜백 함수에서 처리
      await this.pgService.requestPaymentCancel(
        ticket.orderItem.order.id,
        ticket.orderItem.id,
        userId,
        refundAmount,
      );
    } catch (error) {
      // PG 응답 자체를 못 받은 경우(타임아웃/네트워크 에러 등) - PG가 실제로는
      // 처리했을 수 있으므로 FAILED로 확정하지 않는다. REQUESTED 상태와 락을
      // 그대로 두어, 뒤늦은 콜백이 오면 반영되거나 TTL 만료 후 재시도되게 한다.
      const message =
        error instanceof Error ? error.message : 'PG 취소 요청 중 에러 발생';
      this.transactionLoggerService.logRefund(
        ticket.orderItem.order.id,
        ticket.orderItem.id,
        userId,
        refundAmount,
        `PG 취소 요청 응답 실패(PaymentCancel: ${paymentCancel.id}): ${message}`,
      );
    }
  }

  // 만료된 락에 걸린 이전 PaymentCancel의 실제 상태를 PG에 확인한 뒤 확정 처리한다.
  // PG 조회는 외부 I/O이므로 DB 트랜잭션 밖에서 수행한다.
  // 반환값이 true면 이전 건이 이미 PG에서 성공 처리된 것 - 호출부는 새 환불을 만들지 않아야 한다.
  private async settleStaleLock(
    orderId: string,
    orderItemId: string,
    userId: string,
    refundAmount: number,
    staleLock: RefundLock,
  ): Promise<boolean> {
    let inquiryResult: PgCancelInquiryResult;
    try {
      const inquiry = await this.pgService.inquiryPaymentCancel(
        orderId,
        orderItemId,
        userId,
        staleLock.paymentCancelId,
      );
      inquiryResult = inquiry.result;
    } catch (error) {
      // 조회 자체가 실패한 경우("진짜 모름") - 아무것도 확정하지 않고 재시도 자체를 거부한다.
      const message =
        error instanceof Error ? error.message : 'PG 거래조회 중 에러 발생';
      this.transactionLoggerService.logRefund(
        orderId,
        orderItemId,
        userId,
        refundAmount,
        `PG 거래조회 실패로 재시도 거부(PaymentCancel: ${staleLock.paymentCancelId}): ${message}`,
      );
      throw new DomainConflictError(
        '환불 처리 중입니다. 잠시 후 다시 시도해주세요',
      );
    }

    // 2차 트랜잭션: 락 재검증 + 콜백 선착 여부 확인 + 확정 처리
    return await this.refundRepository.runInTransaction(async (tx) => {
      const currentLock = await this.refundRepository.getRefundLock(
        orderItemId,
        tx,
      );
      // 그 사이 다른 요청이 이미 처리했거나 락 상태가 바뀌었으면 물러난다.
      if (
        !currentLock ||
        currentLock.paymentCancelId !== staleLock.paymentCancelId ||
        currentLock.expiresAt > new Date()
      ) {
        throw new DomainConflictError('환불 진행 중인 상품입니다');
      }

      // PG 조회 중 뒤늦은 콜백이 먼저 도착해 이미 확정됐을 수 있다 -
      // 실측된 콜백 결과가 PG 재조회보다 신뢰도가 높으므로 그 결과를 그대로 존중한다.
      const paymentCancel = await this.refundRepository.getPaymentCancelById(
        staleLock.paymentCancelId,
        tx,
      );
      if (paymentCancel.status !== PrismaPaymentCancelStatus.REQUESTED) {
        await this.refundRepository.deleteRefundLock(
          orderItemId,
          staleLock.paymentCancelId,
          tx,
        );
        return paymentCancel.status === PrismaPaymentCancelStatus.SUCCEEDED;
      }

      if (inquiryResult === PgCancelInquiryResult.SUCCEEDED) {
        await this.refundRepository.succeedPaymentCancel(
          staleLock.paymentCancelId,
          new Date(),
          tx,
        );
        await this.refundRepository.deleteRefundLock(
          orderItemId,
          staleLock.paymentCancelId,
          tx,
        );
        return true;
      }

      if (inquiryResult === PgCancelInquiryResult.FAILED) {
        await this.refundRepository.failPaymentCancel(
          staleLock.paymentCancelId,
          'PG가 취소를 실패 처리함',
          undefined,
          new Date(),
          tx,
        );
        await this.refundRepository.deleteRefundLock(
          orderItemId,
          staleLock.paymentCancelId,
          tx,
        );
        return false;
      }

      // NOT_FOUND: 요청이 PG에 도달하지 않은 것으로 판단하고 안전하게 재시도를 허용한다.
      await this.refundRepository.failPaymentCancel(
        staleLock.paymentCancelId,
        'PG 미도달(거래 없음)',
        PaymentCancelFailureCode.PG_NOT_REACHED,
        new Date(),
        tx,
      );
      await this.refundRepository.deleteRefundLock(
        orderItemId,
        staleLock.paymentCancelId,
        tx,
      );
      return false;
    });
  }

  async callback(
    success: boolean,
    paymentCancelId: string,
    orderItemId: string,
    refundedAmount: number,
    reason?: string | null,
  ) {
    const paymentCancel =
      await this.refundRepository.getPaymentCancelById(paymentCancelId);

    // 이 환불 건 자체가 이미 확정됐다면(성공/실패) 재처리하지 않는다.
    if (
      paymentCancel.status === 'SUCCEEDED' ||
      paymentCancel.status === 'FAILED'
    ) {
      return;
    }

    if (success) {
      // 금액 비교 - PG가 실패로 응답한 경우 금액 비교는 의미가 없으므로 성공 시에만 검사한다
      if (refundedAmount === paymentCancel.amount) {
        await this.refundRepository.succeedPaymentCancel(paymentCancelId);
      } else {
        // 잘못된 환불 금액에 대한 처리 - 그대로 성공 처리하지 않고 실패로 확정한다
        // 🔥 관리자가 확인: 상황 자체가 **정상 흐름이 아니라 이상 상황(PG 연동 버그, PG 측 처리 오류)**이기 때문
        await this.refundRepository.failPaymentCancel(
          paymentCancelId,
          `PG 응답 금액 불일치: 요청 ${paymentCancel.amount}, PG 응답 ${refundedAmount}`,
          PaymentCancelFailureCode.AMOUNT_MISMATCH,
        );
        // TODO: 불일치 관리자에게 알림 로직 추가 필요
      }
    } else {
      await this.refundRepository.failPaymentCancel(
        paymentCancelId,
        reason ?? 'PG 응답 실패',
      );
    }

    // deleteLock 자체가 where 절에 paymentCancelId(소유권)를 포함하므로,
    // 재시도가 이미 이 orderItem의 락을 다른 paymentCancelId로 점유했다면
    // 조건에 맞는 행이 없어 조용히 무시된다(다른 시도의 락을 건드리지 않음).
    await this.refundRepository.deleteLock(orderItemId, paymentCancelId);
  }

  async getRefundHistoryByShop(shopId: string, status?: PaymentCancelStatus) {
    // 컨트롤러 경계의 도메인 enum을 Prisma enum으로 매핑해 repository에 전달
    return await this.refundRepository.getRefundHistoryByShop(
      shopId,
      status ? paymentCancelStatusMap[status] : undefined,
    );
  }

  async getRefundHistoryByUser(userId: string, status?: PaymentCancelStatus) {
    return await this.refundRepository.getRefundHistoryByUser(
      userId,
      status ? paymentCancelStatusMap[status] : undefined,
    );
  }
}
