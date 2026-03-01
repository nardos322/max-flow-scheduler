import type { RequestHandler } from 'express';
import { solveResponseSchema, type SolveRequest, type SolveResponse } from '@scheduler/domain';
import { HttpError } from '../../errors/http.error.js';
import { SolverError } from '../../errors/solver.error.js';
import { mapEngineRunnerError } from '../../services/error-mapper.service.js';
import { EngineRunnerError } from '../../services/engine-runner.service.js';
import { solveScheduleWithEngine } from '../../services/solve-schedule.service.js';
import {
  buildSolveRequestFromSprint,
  getSprintRunHistory,
  registerFailedSprintRun,
  registerSucceededSprintRun,
} from '../../services/sprint/sprint-run.service.js';
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

    const result = await markSprintReadyToSolve(sprintId);
    if ('error' in result) {
      if (result.error === 'SPRINT_NOT_FOUND') {
        next(new HttpError(404, { error: 'Sprint not found' }));
        return;
      }

      if (result.error === 'PERIOD_NOT_FOUND') {
        next(new HttpError(404, { error: 'Period not found for sprint' }));
        return;
      }

      if (result.error === 'DOCTOR_NOT_FOUND_OR_INACTIVE') {
        next(new HttpError(422, { error: 'Sprint has missing or inactive doctors', details: result.details ?? [] }));
        return;
      }

      if (result.error === 'NO_DOCTORS') {
        next(new HttpError(422, { error: 'Sprint must include at least one doctor' }));
        return;
      }

      next(new HttpError(422, { error: 'Sprint must include doctor availability before mark ready' }));
      return;
    }

    res.status(200).json(result.sprint);
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

    const buildResult = await buildSolveRequestFromSprint(sprintId);
    if ('error' in buildResult) {
      if (buildResult.error === 'PERIOD_NOT_FOUND') {
        next(new HttpError(404, { error: 'Period not found for sprint' }));
        return;
      }

      if (buildResult.error === 'DOCTOR_NOT_FOUND_OR_INACTIVE') {
        next(new HttpError(422, { error: 'Sprint has missing or inactive doctors', details: buildResult.details ?? [] }));
        return;
      }

      if (buildResult.error === 'NO_DOCTORS') {
        next(new HttpError(422, { error: 'Sprint must include at least one doctor' }));
        return;
      }

      if (buildResult.error === 'NO_AVAILABILITY') {
        next(new HttpError(422, { error: 'Sprint must include doctor availability before solve' }));
        return;
      }

      next(new HttpError(422, { error: 'Sprint data is not ready for solve' }));
      return;
    }

    const solveRequest = buildResult.request;

    try {
      const solverResponse = await solveForSprint(solveRequest);
      const parsedResponse = solveResponseSchema.safeParse(solverResponse);
      if (!parsedResponse.success) {
        await registerFailedSprintRun(
          sprintId,
          solveRequest,
          'INTERNAL_CONTRACT_MISMATCH',
          'Internal contract mismatch',
        );
        next(new HttpError(500, { error: 'Internal contract mismatch' }));
        return;
      }

      const run = await registerSucceededSprintRun(sprintId, solveRequest, parsedResponse.data);
      await markSprintSolved(sprintId);

      res.status(200).json({
        run,
        result: parsedResponse.data,
      });
    } catch (error) {
      if (error instanceof EngineRunnerError) {
        const mapped = mapEngineRunnerError(error);
        await registerFailedSprintRun(sprintId, solveRequest, mapped.code, mapped.message);
        next(mapped);
        return;
      }

      const fallback = new SolverError(500, 'UNEXPECTED_ERROR', 'Unexpected solver failure');
      await registerFailedSprintRun(sprintId, solveRequest, fallback.code, fallback.message);
      next(fallback);
    }
  };
}

export const runSprintSolveController: RequestHandler = createRunSprintSolveController(solveScheduleWithEngine);
