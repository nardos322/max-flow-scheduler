export class SolverError extends Error {
  constructor(
    readonly statusCode: 422 | 500,
    readonly code: string,
    message: string,
    readonly details?: string,
  ) {
    super(message);
    this.name = 'SolverError';
  }
}
