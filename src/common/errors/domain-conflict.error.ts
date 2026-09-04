// 409: 요청이 현재 서버 상태와 충돌함(예: 이미 존재하는 이메일로 회원가입 시도)
export class DomainConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainConflictError';
  }
}
