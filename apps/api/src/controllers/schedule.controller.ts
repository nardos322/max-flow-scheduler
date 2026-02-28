import type { RequestHandler } from 'express';
import { solveResponseSchema, type SolveRequest, type SolveResponse } from '@scheduler/domain';
import { HttpError } from '../errors/http.error.js';
import type { SolveRequestLocals } from '../middlewares/validate-solve-request.middleware.js';
import { solveScheduleWithEngine } from '../services/solve-schedule.service.js';

export type SolveSchedule = (request: SolveRequest) => Promise<SolveResponse>;

export function createSolveScheduleController(solveSchedule: SolveSchedule): RequestHandler {
  return async (_req, res, next) => {
    const { solveRequest } = res.locals as SolveRequestLocals;

    try {
      const solverResponse = await solveSchedule(solveRequest);
      const parsedResponse = solveResponseSchema.safeParse(solverResponse);
      if (!parsedResponse.success) {
        next(new HttpError(500, { error: 'Internal contract mismatch' }));
        return;
      }

      res.status(200).json(parsedResponse.data);
    } catch (error) {
      next(error);
    }
  };
}

export const solveScheduleController: RequestHandler = createSolveScheduleController(solveScheduleWithEngine);
