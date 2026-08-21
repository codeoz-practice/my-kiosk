import { DomainNotFoundError } from 'src/common/errors';

export class UsageSessionNotFoundError extends DomainNotFoundError {
  constructor(sessionId: string) {
    super(`세션을 찾을 수 없습니다: ${sessionId}`);
    this.name = 'UsageSessionNotFoundError';
  }
}
