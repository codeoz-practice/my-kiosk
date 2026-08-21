import { DomainNotFoundError } from 'src/common/errors/domain-not-found.error';

export class PaymentNotFoundError extends DomainNotFoundError {
  constructor(pgTransactionId: string) {
    super(`payment 정보를 찾을 수 없습니다: ${pgTransactionId}`);
    this.name = 'PaymentNotFoundError';
  }
}
