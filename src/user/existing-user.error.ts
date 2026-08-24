import { DomainConflictError } from 'src/common/errors';

export class ExistingEmailError extends DomainConflictError {
  constructor(email: string) {
    super(`이미 존재하는 이메일 입니다: ${email}`);
    this.name = 'ExistingEmailError';
  }
}
