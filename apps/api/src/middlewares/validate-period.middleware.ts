import type { RequestHandler } from 'express';
import {
  createPeriodRequestSchema,
  replacePeriodDemandsRequestSchema,
  updatePeriodRequestSchema,
  type CreatePeriodRequest,
  type ReplacePeriodDemandsRequest,
  type UpdatePeriodRequest,
} from '@scheduler/domain';
import { HttpError } from '../errors/http.error.js';

export type PeriodLocals = {
  createPeriodRequest?: CreatePeriodRequest;
  updatePeriodRequest?: UpdatePeriodRequest;
  replacePeriodDemandsRequest?: ReplacePeriodDemandsRequest;
};

function mapIssues(issues: Array<{ path: (string | number)[]; message: string }>) {
  return issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

export const validateCreatePeriodMiddleware: RequestHandler = (req, res, next) => {
  const parsed = createPeriodRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid period payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as PeriodLocals).createPeriodRequest = parsed.data;
  next();
};

export const validateUpdatePeriodMiddleware: RequestHandler = (req, res, next) => {
  const parsed = updatePeriodRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid period update payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as PeriodLocals).updatePeriodRequest = parsed.data;
  next();
};

export const validateReplacePeriodDemandsMiddleware: RequestHandler = (req, res, next) => {
  const parsed = replacePeriodDemandsRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid period demands payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as PeriodLocals).replacePeriodDemandsRequest = parsed.data;
  next();
};
