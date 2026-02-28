export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly body: Record<string, unknown>,
  ) {
    super(typeof body.error === 'string' ? body.error : 'HTTP error');
    this.name = 'HttpError';
  }
}
