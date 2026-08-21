import { DomainConflictError } from 'src/common/errors/domain-conflict.error';

export class DuplicatePaymentRequestError extends DomainConflictError {
  constructor(readonly orderId: string) {
    super(`이미 진행 중이거나 완료된 결제가 있는 주문입니다: ${orderId}`);
    this.name = 'DuplicatePaymentRequestError';
  }
}
