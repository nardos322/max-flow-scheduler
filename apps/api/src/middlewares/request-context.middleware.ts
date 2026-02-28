import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export type RequestContextLocals = {
  requestId: string;
};

export const requestContextMiddleware: RequestHandler = (req, res, next) => {
  const headerValue = req.headers['x-request-id'];
  const requestId = typeof headerValue === 'string' && headerValue.trim().length > 0 ? headerValue : randomUUID();

  (res.locals as RequestContextLocals).requestId = requestId;
  res.setHeader('x-request-id', requestId);

  next();
};
