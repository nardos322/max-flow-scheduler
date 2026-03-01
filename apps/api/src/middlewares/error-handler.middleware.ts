import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../errors/http.error.js';
import { SolverError } from '../errors/solver.error.js';
import type { RequestContextLocals } from './request-context.middleware.js';

export const notFoundMiddleware: RequestHandler = (_req, res) => {
  const { requestId } = res.locals as RequestContextLocals;
  res.status(404).json({ error: 'Route not found', requestId });
};

type BodyParserError = {
  status?: number;
  type?: string;
};

function isBodyTooLargeError(error: unknown): boolean {
  const candidate = error as BodyParserError;
  return candidate?.status === 413 || candidate?.type === 'entity.too.large';
}

function isBodyParseFailedError(error: unknown): boolean {
  const candidate = error as BodyParserError;
  return candidate?.status === 400 && candidate?.type === 'entity.parse.failed';
}

function sanitizeDetails(statusCode: number, details?: string): string | undefined {
  if (!details || statusCode >= 500) {
    return undefined;
  }

  return details.length > 512 ? `${details.slice(0, 512)}...` : details;
}

export const errorHandlerMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  void next;
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

  if (isBodyTooLargeError(error)) {
    logError(413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
    res.status(413).json({ error: 'Request body too large', code: 'PAYLOAD_TOO_LARGE', requestId });
    return;
  }

  if (isBodyParseFailedError(error)) {
    logError(400, 'INVALID_JSON', 'Malformed JSON body');
    res.status(400).json({ error: 'Malformed JSON body', code: 'INVALID_JSON', requestId });
    return;
  }

  if (error instanceof HttpError) {
    if (error.statusCode >= 500) {
      logError(500, 'HTTP_ERROR', 'Unexpected server error');
      res.status(500).json({ error: 'Unexpected server error', requestId });
      return;
    }

    const code = error.statusCode === 400 ? 'INVALID_REQUEST' : 'HTTP_ERROR';
    logError(error.statusCode, code, error.message);
    res.status(error.statusCode).json({ ...error.body, requestId });
    return;
  }

  if (error instanceof SolverError) {
    const details = sanitizeDetails(error.statusCode, error.details);
    logError(error.statusCode, error.code, error.message, details);
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details,
      requestId,
    });
    return;
  }

  logError(500, 'UNEXPECTED_ERROR', 'Unexpected solver failure');
  res.status(500).json({ error: 'Unexpected solver failure', requestId });
};
