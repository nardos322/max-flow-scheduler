import type { RequestHandler } from 'express';
import type { RequestContextLocals } from './request-context.middleware.js';

export const requestLoggerMiddleware: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const { requestId } = res.locals as RequestContextLocals;

    console.info(
      JSON.stringify({
        level: 'info',
        event: 'http_request',
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
      }),
    );
  });

  next();
};
