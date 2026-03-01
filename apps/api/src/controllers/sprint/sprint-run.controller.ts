import type { RequestHandler } from 'express';
import { solveResponseSchema, type SolveRequest, type SolveResponse } from '@scheduler/domain';
import { HttpError } from '../../errors/http.error.js';
import { SolverError } from '../../errors/solver.error.js';
import type { SprintRunLocals } from '../../middlewares/sprint/validate-sprint-run.middleware.js';
import { mapEngineRunnerError } from '../../services/error-mapper.service.js';
import { EngineRunnerError } from '../../services/engine-runner.service.js';
import { solveScheduleWithEngine } from '../../services/solve-schedule.service.js';
import { getSprintRunHistory, registerFailedSprintRun, registerSucceededSprintRun } from '../../services/sprint/sprint-run.service.js';
import { findSprintOrNull } from '../../services/sprint/sprint.service.js';
import { markSprintReadyToSolve, markSprintSolved } from '../../services/sprint/sprint-ready.service.js';

type SolveForSprint = (request: SolveRequest) => Promise<SolveResponse>;

export const markSprintReadyController: RequestHandler = async (req, res, next) => {
  try {
    const sprintId = req.params.sprintId;
    if (!sprintId) {
      next(new HttpError(400, { error: 'Missing sprintId route param' }));
      return;
    }

    const sprint = await markSprintReadyToSolve(sprintId);
    if (!sprint) {
      next(new HttpError(404, { error: 'Sprint not found' }));
      return;
    }

    res.status(200).json(sprint);
  } catch (error) {
    next(error);
  }
};

export const listSprintRunsController: RequestHandler = async (req, res, next) => {
  try {
    const sprintId = req.params.sprintId;
    if (!sprintId) {
      next(new HttpError(400, { error: 'Missing sprintId route param' }));
      return;
    }

    const sprint = await findSprintOrNull(sprintId);
    if (!sprint) {
      next(new HttpError(404, { error: 'Sprint not found' }));
      return;
    }

    res.status(200).json({ items: await getSprintRunHistory(sprintId) });
  } catch (error) {
    next(error);
  }
};

export function createRunSprintSolveController(solveForSprint: SolveForSprint): RequestHandler {
  return async (req, res, next) => {
    const sprintId = req.params.sprintId;
    if (!sprintId) {
      next(new HttpError(400, { error: 'Missing sprintId route param' }));
      return;
    }

    const sprint = await findSprintOrNull(sprintId);
    if (!sprint) {
      next(new HttpError(404, { error: 'Sprint not found' }));
      return;
    }

    if (sprint.status !== 'ready-to-solve') {
      next(new HttpError(422, { error: 'Sprint is not ready to solve' }));
      return;
    }

    const payload = (res.locals as SprintRunLocals).runSolveRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Run sprint solve payload not validated' }));
      return;
    }

    try {
      const solverResponse = await solveForSprint(payload.request);
      const parsedResponse = solveResponseSchema.safeParse(solverResponse);
      if (!parsedResponse.success) {
        await registerFailedSprintRun(
          sprintId,
          payload.request,
          'INTERNAL_CONTRACT_MISMATCH',
          'Internal contract mismatch',
        );
        next(new HttpError(500, { error: 'Internal contract mismatch' }));
        return;
      }

      const run = await registerSucceededSprintRun(sprintId, payload.request, parsedResponse.data);
      await markSprintSolved(sprintId);

      res.status(200).json({
        run,
        result: parsedResponse.data,
      });
    } catch (error) {
      if (error instanceof EngineRunnerError) {
        const mapped = mapEngineRunnerError(error);
        await registerFailedSprintRun(sprintId, payload.request, mapped.code, mapped.message);
        next(mapped);
        return;
      }

      const fallback = new SolverError(500, 'UNEXPECTED_ERROR', 'Unexpected solver failure');
      await registerFailedSprintRun(sprintId, payload.request, fallback.code, fallback.message);
      next(fallback);
    }
  };
}

export const runSprintSolveController: RequestHandler = createRunSprintSolveController(solveScheduleWithEngine);
