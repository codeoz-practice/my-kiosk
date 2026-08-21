import { DomainForbiddenError } from 'src/common/errors/domain-forbidden.error';

export class PaymentRequesterMismatchError extends DomainForbiddenError {
  constructor(readonly orderId: string) {
    super(`주문자와 결제 요청자가 일치하지 않습니다: ${orderId}`);
    this.name = 'PaymentRequesterMismatchError';
  }
}
