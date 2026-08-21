import { DomainConflictError } from 'src/common/errors';

export class PaymentUpdateError extends DomainConflictError {
  constructor(readonly paymentId: string) {
    super(`payment 업데이트에 실패 했습니다: ${paymentId}`);
    this.name = 'PaymentUpdateError';
  }
}
