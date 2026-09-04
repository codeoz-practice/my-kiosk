// 400: 요청 형식 자체가 잘못됨(문법 오류, 잘못된 파라미터 등)
export class DomainBadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainBadRequestError';
  }
}
