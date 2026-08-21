import { DomainBadRequestError } from 'src/common/errors/domain-bad-request.error';

export class MissingOrderFilterError extends DomainBadRequestError {
  constructor() {
    super('shopId 또는 userId 중 하나는 필수입니다');
    this.name = 'MissingOrderFilterError';
  }
}
