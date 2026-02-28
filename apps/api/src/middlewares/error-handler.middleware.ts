import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../errors/http.error.js';
import { SolverError } from '../errors/solver.error.js';
import type { RequestContextLocals } from './request-context.middleware.js';

export const notFoundMiddleware: RequestHandler = (_req, res) => {
  const { requestId } = res.locals as RequestContextLocals;
  res.status(404).json({ error: 'Route not found', requestId });
};

export const errorHandlerMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const { requestId } = res.locals as RequestContextLocals;

  const logError = (statusCode: number, code: string, message: string, details?: string) => {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'http_error',
        requestId,
        method: req.method,
        path: req.path,
        statusCode,
        code,
        message,
        details,
      }),
    );
  };

  if (error instanceof HttpError) {
    const code = error.statusCode === 400 ? 'INVALID_REQUEST' : 'HTTP_ERROR';
    logError(error.statusCode, code, error.message);
    res.status(error.statusCode).json({ ...error.body, requestId });
    return;
  }

  if (error instanceof SolverError) {
    logError(error.statusCode, error.code, error.message, error.details);
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
      requestId,
    });
    return;
  }

  logError(500, 'UNEXPECTED_ERROR', 'Unexpected solver failure');
  res.status(500).json({ error: 'Unexpected solver failure', requestId });
};
