import { DomainConflictError } from 'src/common/errors/domain-conflict.error';

export class PaymentAlreadyClosedError extends DomainConflictError {
  constructor(paymentId: string, status: string) {
    super(`이미 종결된 결재에 대한 승인 콜백입니다: ${paymentId} (status: ${status})`);
    this.name = 'PaymentAlreadyClosedError';
  }
}
