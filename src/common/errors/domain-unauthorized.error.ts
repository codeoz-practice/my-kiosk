// 401: 인증되지 않음 (로그인이 필요함)
export class DomainUnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainUnauthorizedError';
  }
}
