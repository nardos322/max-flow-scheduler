import express from 'express';
import type { Express } from 'express';
import type { RequestHandler } from 'express';
import { solveRequestSchema, solveResponseSchema, type SolveRequest, type SolveResponse } from '@scheduler/domain';

export const healthHandler: RequestHandler = (_req, res) => {
  res.status(200).json({ status: 'ok' });
};

function buildDraftResponse(payload: SolveRequest): SolveResponse {
  const uncoveredDays = payload.demands.map((demand) => demand.dayId);
  return {
    contractVersion: payload.contractVersion,
    isFeasible: false,
    assignedCount: 0,
    uncoveredDays,
    assignments: [],
  };
}

export const solveScheduleHandler: RequestHandler = (req, res) => {
  const parsedRequest = solveRequestSchema.safeParse(req.body);
  if (!parsedRequest.success) {
    res.status(400).json({
      error: 'Invalid schedule payload',
      issues: parsedRequest.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  const draftResponse = buildDraftResponse(parsedRequest.data);
  const parsedResponse = solveResponseSchema.safeParse(draftResponse);
  if (!parsedResponse.success) {
    res.status(500).json({ error: 'Internal contract mismatch' });
    return;
  }

  res.status(200).json(parsedResponse.data);
};

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', healthHandler);
  app.post('/schedule/solve', solveScheduleHandler);

  return app;
}
