// 404: 요청한 리소스를 찾을 수 없음
export class DomainNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainNotFoundError';
  }
}
