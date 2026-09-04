// 403: 인증은 됐지만 권한이 없음(접근 금지)
export class DomainForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainForbiddenError';
  }
}
