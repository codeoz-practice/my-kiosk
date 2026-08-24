export class DomainForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainForbiddenError';
  }
}
