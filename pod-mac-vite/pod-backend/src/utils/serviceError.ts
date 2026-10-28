/** Only curated, public-safe errors cross the HTTP boundary. */
export class ServiceError extends Error {
  constructor(readonly code: string, message: string, readonly status = 502) {
    super(message);
    this.name = 'ServiceError';
  }
}
