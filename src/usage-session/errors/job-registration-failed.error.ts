import { DomainConflictError } from 'src/common/errors/domain-conflict.error';

export class JobRegistrationFailedError extends DomainConflictError {
  constructor(readonly sessionId: string) {
    super(`작업 등록에 실패했습니다: ${sessionId}`);
    this.name = 'JobRegistrationFailedError';
  }
}
