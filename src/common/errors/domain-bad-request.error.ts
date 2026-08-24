export class DomainBadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainBadRequestError';
  }
}
