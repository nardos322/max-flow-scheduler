import type { RequestHandler } from 'express';
import {
  addPlanningCycleSprintRequestSchema,
  createPlanningCycleRequestSchema,
  runPlanningCycleRequestSchema,
  type AddPlanningCycleSprintRequest,
  type CreatePlanningCycleRequest,
  type RunPlanningCycleRequest,
} from '@scheduler/domain';
import { HttpError } from '../../errors/http.error.js';

export type PlanningCycleLocals = {
  createPlanningCycleRequest?: CreatePlanningCycleRequest;
  addPlanningCycleSprintRequest?: AddPlanningCycleSprintRequest;
  runPlanningCycleRequest?: RunPlanningCycleRequest;
};

function mapIssues(issues: Array<{ path: (string | number)[]; message: string }>) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export const validateCreatePlanningCycleMiddleware: RequestHandler = (req, res, next) => {
  const parsed = createPlanningCycleRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid planning cycle payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as PlanningCycleLocals).createPlanningCycleRequest = parsed.data;
  next();
};

export const validateAddPlanningCycleSprintMiddleware: RequestHandler = (req, res, next) => {
  const parsed = addPlanningCycleSprintRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid add sprint payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as PlanningCycleLocals).addPlanningCycleSprintRequest = parsed.data;
  next();
};

export const validateRunPlanningCycleMiddleware: RequestHandler = (req, res, next) => {
  const parsed = runPlanningCycleRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid planning cycle run payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as PlanningCycleLocals).runPlanningCycleRequest = parsed.data;
  next();
};
