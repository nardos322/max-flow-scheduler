import type { RequestHandler } from 'express';
import {
  createDoctorRequestSchema,
  updateDoctorRequestSchema,
  type CreateDoctorRequest,
  type UpdateDoctorRequest,
} from '@scheduler/domain';
import { HttpError } from '../errors/http.error.js';

export type DoctorLocals = {
  createDoctorRequest?: CreateDoctorRequest;
  updateDoctorRequest?: UpdateDoctorRequest;
};

function mapIssues(issues: Array<{ path: (string | number)[]; message: string }>) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export const validateCreateDoctorMiddleware: RequestHandler = (req, res, next) => {
  const parsed = createDoctorRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid doctor payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as DoctorLocals).createDoctorRequest = parsed.data;
  next();
};

export const validateUpdateDoctorMiddleware: RequestHandler = (req, res, next) => {
  const parsed = updateDoctorRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid doctor update payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as DoctorLocals).updateDoctorRequest = parsed.data;
  next();
};
