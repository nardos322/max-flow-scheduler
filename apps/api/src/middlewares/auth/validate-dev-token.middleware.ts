import type { RequestHandler } from 'express';
import { z } from 'zod';
import { userRoleSchema, type UserRole } from '@scheduler/domain';
import { HttpError } from '../../errors/http.error.js';

const issueDevTokenRequestSchema = z.object({
  userId: z.string().min(1),
  role: userRoleSchema,
  expiresInSeconds: z.number().int().positive().max(43200).optional(),
});

export type IssueDevTokenRequest = {
  userId: string;
  role: UserRole;
  expiresInSeconds?: number | undefined;
};

export type DevTokenLocals = {
  issueDevTokenRequest?: IssueDevTokenRequest;
};

function mapIssues(issues: Array<{ path: (string | number)[]; message: string }>) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export const validateIssueDevTokenMiddleware: RequestHandler = (req, res, next) => {
  const parsed = issueDevTokenRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new HttpError(400, { error: 'Invalid dev token payload', issues: mapIssues(parsed.error.issues) }));
    return;
  }

  (res.locals as DevTokenLocals).issueDevTokenRequest = parsed.data;
  next();
};
