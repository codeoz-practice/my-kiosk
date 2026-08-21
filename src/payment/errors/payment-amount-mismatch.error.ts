import { DomainForbiddenError } from 'src/common/errors/domain-forbidden.error';

export class PaymentAmountMismatchError extends DomainForbiddenError {
  constructor(paymentId: string) {
    super(`결재 금액이 일치하지 않습니다:${paymentId}`);
    this.name = 'PaymentAmountMismatchError';
  }
}
