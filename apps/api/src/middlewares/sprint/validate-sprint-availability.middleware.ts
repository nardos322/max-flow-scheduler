import type { RequestHandler } from 'express';
import {
  plannerOverrideAvailabilityRequestSchema,
  setDoctorAvailabilityRequestSchema,
  type PlannerOverrideAvailabilityRequest,
  type SetDoctorAvailabilityRequest,
} from '@scheduler/domain';
import { HttpError } from '../../errors/http.error.js';

export type SprintAvailabilityLocals = {
  setDoctorAvailabilityRequest?: SetDoctorAvailabilityRequest;
  plannerOverrideAvailabilityRequest?: PlannerOverrideAvailabilityRequest;
};

function mapIssues(issues: Array<{ path: (string | number)[]; message: string }>) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export const validateSetDoctorAvailabilityMiddleware: RequestHandler = (req, res, next) => {
  const parsed = setDoctorAvailabilityRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid doctor availability payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as SprintAvailabilityLocals).setDoctorAvailabilityRequest = parsed.data;
  next();
};

export const validatePlannerOverrideAvailabilityMiddleware: RequestHandler = (req, res, next) => {
  const parsed = plannerOverrideAvailabilityRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid planner override payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as SprintAvailabilityLocals).plannerOverrideAvailabilityRequest = parsed.data;
  next();
};
