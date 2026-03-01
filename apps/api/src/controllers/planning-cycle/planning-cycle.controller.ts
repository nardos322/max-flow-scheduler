import type { RequestHandler } from 'express';
import { HttpError } from '../../errors/http.error.js';
import type { PlanningCycleLocals } from '../../middlewares/planning-cycle/validate-planning-cycle.middleware.js';
import {
  addSprintToPlanningCycle,
  createPlanningCycle,
  findPlanningCycleOrNull,
  getPlanningCycleRunsPage,
  getPlanningCyclesPage,
  runPlanningCycle,
} from '../../services/planning-cycle/planning-cycle.service.js';

function parsePageQuery(query: Record<string, unknown>): { limit: number; cursor?: string } | { error: string } {
  const rawLimit = typeof query.limit === 'string' ? query.limit : undefined;
  const rawCursor = typeof query.cursor === 'string' ? query.cursor : undefined;
  const limit = rawLimit ? Number(rawLimit) : 20;
  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    return { error: 'Invalid limit query param; expected integer between 1 and 100' };
  }
  if (rawCursor && Number.isNaN(new Date(rawCursor).getTime())) {
    return { error: 'Invalid cursor query param; expected ISO datetime' };
  }
  return { limit, ...(rawCursor ? { cursor: rawCursor } : {}) };
}

export const createPlanningCycleController: RequestHandler = async (_req, res, next) => {
  try {
    const payload = (res.locals as PlanningCycleLocals).createPlanningCycleRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Create planning cycle payload not validated' }));
      return;
    }

    const cycle = await createPlanningCycle(payload);
    res.status(201).json(cycle);
  } catch (error) {
    next(error);
  }
};

export const listPlanningCyclesController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = parsePageQuery((req.query ?? {}) as Record<string, unknown>);
    if ('error' in parsed) {
      next(new HttpError(400, { error: parsed.error }));
      return;
    }

    res.status(200).json(await getPlanningCyclesPage(parsed));
  } catch (error) {
    next(error);
  }
};

export const getPlanningCycleController: RequestHandler = async (req, res, next) => {
  try {
    const cycleId = req.params.cycleId;
    if (!cycleId) {
      next(new HttpError(400, { error: 'Missing cycleId route param' }));
      return;
    }

    const cycle = await findPlanningCycleOrNull(cycleId);
    if (!cycle) {
      next(new HttpError(404, { error: 'Planning cycle not found' }));
      return;
    }

    res.status(200).json(cycle);
  } catch (error) {
    next(error);
  }
};

export const addPlanningCycleSprintController: RequestHandler = async (req, res, next) => {
  try {
    const cycleId = req.params.cycleId;
    if (!cycleId) {
      next(new HttpError(400, { error: 'Missing cycleId route param' }));
      return;
    }

    const payload = (res.locals as PlanningCycleLocals).addPlanningCycleSprintRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Add planning cycle sprint payload not validated' }));
      return;
    }

    const result = await addSprintToPlanningCycle(cycleId, payload.sprintId, payload.orderIndex);
    if ('error' in result) {
      if (result.error === 'CYCLE_NOT_FOUND') {
        next(new HttpError(404, { error: 'Planning cycle not found' }));
        return;
      }
      if (result.error === 'SPRINT_NOT_FOUND') {
        next(new HttpError(404, { error: 'Sprint not found' }));
        return;
      }
      if (result.error === 'SPRINT_ALREADY_IN_CYCLE') {
        next(new HttpError(409, { error: 'Sprint already in planning cycle' }));
        return;
      }
      next(new HttpError(422, { error: 'Invalid orderIndex for planning cycle sprint' }));
      return;
    }

    res.status(200).json(result.cycle);
  } catch (error) {
    next(error);
  }
};

export const runPlanningCycleController: RequestHandler = async (req, res, next) => {
  try {
    const cycleId = req.params.cycleId;
    if (!cycleId) {
      next(new HttpError(400, { error: 'Missing cycleId route param' }));
      return;
    }

    const result = await runPlanningCycle(cycleId);
    if ('error' in result) {
      if (result.error === 'CYCLE_NOT_FOUND') {
        next(new HttpError(404, { error: 'Planning cycle not found' }));
        return;
      }
      next(new HttpError(422, { error: 'Planning cycle must include at least one sprint before run' }));
      return;
    }

    res.status(200).json(result.run);
  } catch (error) {
    next(error);
  }
};

export const listPlanningCycleRunsController: RequestHandler = async (req, res, next) => {
  try {
    const cycleId = req.params.cycleId;
    if (!cycleId) {
      next(new HttpError(400, { error: 'Missing cycleId route param' }));
      return;
    }

    const cycle = await findPlanningCycleOrNull(cycleId);
    if (!cycle) {
      next(new HttpError(404, { error: 'Planning cycle not found' }));
      return;
    }

    const parsed = parsePageQuery((req.query ?? {}) as Record<string, unknown>);
    if ('error' in parsed) {
      next(new HttpError(400, { error: parsed.error }));
      return;
    }

    res.status(200).json(await getPlanningCycleRunsPage(cycleId, parsed));
  } catch (error) {
    next(error);
  }
};
