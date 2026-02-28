import type { RequestHandler } from 'express';
import {
  markSprintReadyRequestSchema,
  runSprintSolveRequestSchema,
  type MarkSprintReadyRequest,
  type RunSprintSolveRequest,
} from '@scheduler/domain';
import { HttpError } from '../../errors/http.error.js';

export type SprintRunLocals = {
  markReadyRequest?: MarkSprintReadyRequest;
  runSolveRequest?: RunSprintSolveRequest;
};

function mapIssues(issues: Array<{ path: (string | number)[]; message: string }>) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export const validateMarkSprintReadyMiddleware: RequestHandler = (req, res, next) => {
  const parsed = markSprintReadyRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid sprint status payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as SprintRunLocals).markReadyRequest = parsed.data;
  next();
};

export const validateRunSprintSolveMiddleware: RequestHandler = (req, res, next) => {
  const parsed = runSprintSolveRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid sprint solve payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as SprintRunLocals).runSolveRequest = parsed.data;
  next();
};
