import type { RequestHandler } from 'express';
import type { SolveRequest } from '@scheduler/domain';
import { solveRequestSchema } from '@scheduler/domain';
import { HttpError } from '../errors/http.error.js';

export type SolveRequestLocals = {
  solveRequest: SolveRequest;
};

export const validateSolveRequestMiddleware: RequestHandler = (req, res, next) => {
  const parsedRequest = solveRequestSchema.safeParse(req.body);
  if (!parsedRequest.success) {
    next(
      new HttpError(400, {
        error: 'Invalid schedule payload',
        issues: parsedRequest.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }),
    );
    return;
  }

  (res.locals as SolveRequestLocals).solveRequest = parsedRequest.data;
  next();
};
