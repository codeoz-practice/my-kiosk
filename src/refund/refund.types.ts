import { PaymentCancelStatus as PrismaPaymentCancelStatus } from '@prisma/client';

// 서비스/컨트롤러 계층이 Prisma enum을 직접 알지 못하게 분리한 도메인 전용 상태값
export enum PaymentCancelStatus {
  REQUESTED = 'REQUESTED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export const paymentCancelStatusMap: Record<
  PaymentCancelStatus,
  PrismaPaymentCancelStatus
> = {
  [PaymentCancelStatus.REQUESTED]: PrismaPaymentCancelStatus.REQUESTED,
  [PaymentCancelStatus.SUCCEEDED]: PrismaPaymentCancelStatus.SUCCEEDED,
  [PaymentCancelStatus.FAILED]: PrismaPaymentCancelStatus.FAILED,
};
