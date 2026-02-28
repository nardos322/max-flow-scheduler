import express from 'express';
import type { Express } from 'express';
import type { RequestHandler } from 'express';
import { solveRequestSchema, solveResponseSchema, type SolveRequest, type SolveResponse } from '@scheduler/domain';
import { EngineRunnerError, solveWithEngine } from './engine-runner.js';

export const healthHandler: RequestHandler = (_req, res) => {
  res.status(200).json({ status: 'ok' });
};

export type SolveSchedule = (request: SolveRequest) => Promise<SolveResponse>;

export function createSolveScheduleHandler(solveSchedule: SolveSchedule): RequestHandler {
  return async (req, res) => {
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

    try {
      const solverResponse = await solveSchedule(parsedRequest.data);
      const parsedResponse = solveResponseSchema.safeParse(solverResponse);
      if (!parsedResponse.success) {
        res.status(500).json({ error: 'Internal contract mismatch' });
        return;
      }

      res.status(200).json(parsedResponse.data);
    } catch (error) {
      if (error instanceof EngineRunnerError) {
        res.status(500).json({
          error: 'Solver execution failed',
          details: error.code,
        });
        return;
      }

      res.status(500).json({ error: 'Unexpected solver failure' });
    }
  };
}

export const solveScheduleHandler: RequestHandler = createSolveScheduleHandler(async (request) => {
  const engineBinary = process.env.SCHEDULER_ENGINE_BINARY;
  return solveWithEngine(request, engineBinary ? { engineBinary, timeoutMs: 5_000 } : { timeoutMs: 5_000 });
});

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', healthHandler);
  app.post('/schedule/solve', solveScheduleHandler);

  return app;
}
