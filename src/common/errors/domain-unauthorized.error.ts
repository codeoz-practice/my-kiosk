export class DomainUnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainUnauthorizedError';
  }
}
