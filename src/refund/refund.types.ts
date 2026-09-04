import { PaymentCancelStatus as PrismaPaymentCancelStatus } from '@prisma/client';

// 서비스/컨트롤러 계층이 Prisma enum을 직접 알지 못하게 분리한 도메인 전용 상태값
export enum PaymentCancelStatus {
  REQUESTED = 'REQUESTED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export const paymentCancelStatusMap: Record<
  PaymentCancelStatus,
  PrismaPaymentCancelStatus
> = {
  [PaymentCancelStatus.REQUESTED]: PrismaPaymentCancelStatus.REQUESTED,
  [PaymentCancelStatus.PENDING_APPROVAL]:
    PrismaPaymentCancelStatus.PENDING_APPROVAL,
  [PaymentCancelStatus.SUCCEEDED]: PrismaPaymentCancelStatus.SUCCEEDED,
  [PaymentCancelStatus.FAILED]: PrismaPaymentCancelStatus.FAILED,
};

// refund() 처리 결과 - 사용 이력 유무에 따라 자동 처리(즉시 락+PG 요청)와
// 승인 대기(점주가 금액을 입력해야 함) 두 갈래로 나뉜다.
export type RefundResult =
  | { status: 'PROCESSED' }
  | { status: 'PENDING_APPROVAL'; paymentCancelId: string };
