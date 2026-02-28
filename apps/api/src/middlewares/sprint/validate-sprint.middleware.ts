import type { RequestHandler } from 'express';
import {
  createSprintRequestSchema,
  updateSprintGlobalConfigRequestSchema,
  type CreateSprintRequest,
  type UpdateSprintGlobalConfigRequest,
} from '@scheduler/domain';
import { HttpError } from '../../errors/http.error.js';

export type SprintLocals = {
  createSprintRequest?: CreateSprintRequest;
  updateGlobalConfigRequest?: UpdateSprintGlobalConfigRequest;
};

function mapIssues(issues: Array<{ path: (string | number)[]; message: string }>) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export const validateCreateSprintMiddleware: RequestHandler = (req, res, next) => {
  const parsed = createSprintRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid sprint payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as SprintLocals).createSprintRequest = parsed.data;
  next();
};

export const validateUpdateSprintGlobalConfigMiddleware: RequestHandler = (req, res, next) => {
  const parsed = updateSprintGlobalConfigRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid sprint global config payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as SprintLocals).updateGlobalConfigRequest = parsed.data;
  next();
};
