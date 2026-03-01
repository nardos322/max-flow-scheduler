import { solveResponseSchema, type PlanningCycle, type PlanningCycleRun, type SolveRequest, type SolveResponse } from '@scheduler/domain';
import { SolverError } from '../../errors/solver.error.js';
import { mapEngineRunnerError } from '../error-mapper.service.js';
import { EngineRunnerError } from '../engine-runner.service.js';
import { solveScheduleWithEngine } from '../solve-schedule.service.js';
import { findSprintOrNull } from '../sprint/sprint.service.js';
import { buildSolveRequestFromSprint, registerFailedSprintRun, registerSucceededSprintRun } from '../sprint/sprint-run.service.js';
import { markSprintSolved } from '../sprint/sprint-ready.service.js';
import {
  appendPlanningCycleRun,
  getPlanningCycleById,
  listPlanningCycleRunsPage,
  listPlanningCyclesPage,
  savePlanningCycle,
  type PlanningCyclePageResult,
  type PlanningCycleRunPageResult,
} from './planning-cycle.repository.js';

type SolveForSprint = (request: SolveRequest) => Promise<SolveResponse>;

function createPlanningCycleId(): string {
  return `cycle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPlanningCycleRunId(): string {
  return `cycle-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createPlanningCycle(payload: { name: string }): Promise<PlanningCycle> {
  const timestamp = new Date().toISOString();
  return savePlanningCycle({
    id: createPlanningCycleId(),
    name: payload.name,
    status: 'draft',
    sprintIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function findPlanningCycleOrNull(cycleId: string): Promise<PlanningCycle | null> {
  return getPlanningCycleById(cycleId);
}

export async function getPlanningCyclesPage(options: { limit: number; cursor?: string }): Promise<PlanningCyclePageResult> {
  return listPlanningCyclesPage(options);
}

export type AddSprintToPlanningCycleResult =
  | { cycle: PlanningCycle }
  | { error: 'CYCLE_NOT_FOUND' | 'SPRINT_NOT_FOUND' | 'SPRINT_ALREADY_IN_CYCLE' | 'INVALID_ORDER_INDEX' };

export async function addSprintToPlanningCycle(
  cycleId: string,
  sprintId: string,
  orderIndex?: number,
): Promise<AddSprintToPlanningCycleResult> {
  const cycle = await getPlanningCycleById(cycleId);
  if (!cycle) {
    return { error: 'CYCLE_NOT_FOUND' };
  }

  const sprint = await findSprintOrNull(sprintId);
  if (!sprint) {
    return { error: 'SPRINT_NOT_FOUND' };
  }

  if (cycle.sprintIds.includes(sprintId)) {
    return { error: 'SPRINT_ALREADY_IN_CYCLE' };
  }

  const sprintIds = [...cycle.sprintIds];
  if (typeof orderIndex === 'number') {
    if (orderIndex < 1 || orderIndex > sprintIds.length + 1) {
      return { error: 'INVALID_ORDER_INDEX' };
    }
    sprintIds.splice(orderIndex - 1, 0, sprintId);
  } else {
    sprintIds.push(sprintId);
  }

  const updated: PlanningCycle = {
    ...cycle,
    sprintIds,
    updatedAt: new Date().toISOString(),
  };

  return { cycle: await savePlanningCycle(updated) };
}

export async function getPlanningCycleRunsPage(
  cycleId: string,
  options: { limit: number; cursor?: string },
): Promise<PlanningCycleRunPageResult> {
  return listPlanningCycleRunsPage(cycleId, options);
}

type PlanningCycleRunFailure = {
  code: string;
  message: string;
};

function createFailedItem(
  sprintId: string,
  failure: PlanningCycleRunFailure,
  executedAt: string,
  inputSnapshot?: SolveRequest,
): PlanningCycleRun['items'][number] {
  return {
    sprintId,
    executedAt,
    status: 'failed',
    ...(inputSnapshot ? { inputSnapshot } : {}),
    error: {
      code: failure.code,
      message: failure.message,
    },
  };
}

function toCycleRunStatus(items: PlanningCycleRun['items']): PlanningCycleRun['status'] {
  if (items.every((item) => item.status === 'succeeded')) {
    return 'succeeded';
  }
  if (items.every((item) => item.status === 'failed')) {
    return 'failed';
  }
  return 'partial-failed';
}

export type RunPlanningCycleResult =
  | { run: PlanningCycleRun }
  | { error: 'CYCLE_NOT_FOUND' | 'NO_SPRINTS' };

export async function runPlanningCycle(
  cycleId: string,
  solveForSprint: SolveForSprint = solveScheduleWithEngine,
): Promise<RunPlanningCycleResult> {
  const cycle = await getPlanningCycleById(cycleId);
  if (!cycle) {
    return { error: 'CYCLE_NOT_FOUND' };
  }

  if (cycle.sprintIds.length === 0) {
    return { error: 'NO_SPRINTS' };
  }

  const items: PlanningCycleRun['items'] = [];

  for (const sprintId of cycle.sprintIds) {
    const executedAt = new Date().toISOString();
    const sprint = await findSprintOrNull(sprintId);
    if (!sprint) {
      items.push(createFailedItem(sprintId, { code: 'SPRINT_NOT_FOUND', message: 'Sprint not found' }, executedAt));
      continue;
    }

    if (sprint.status !== 'ready-to-solve') {
      items.push(
        createFailedItem(sprintId, { code: 'SPRINT_NOT_READY', message: 'Sprint is not ready to solve' }, executedAt),
      );
      continue;
    }

    const buildResult = await buildSolveRequestFromSprint(sprintId);
    if ('error' in buildResult) {
      items.push(
        createFailedItem(
          sprintId,
          { code: buildResult.error, message: 'Sprint data is not ready for solve' },
          executedAt,
        ),
      );
      continue;
    }

    const solveRequest = buildResult.request;
    try {
      const rawResponse = await solveForSprint(solveRequest);
      const parsedResponse = solveResponseSchema.safeParse(rawResponse);
      if (!parsedResponse.success) {
        await registerFailedSprintRun(sprintId, solveRequest, 'INTERNAL_CONTRACT_MISMATCH', 'Internal contract mismatch');
        items.push(
          createFailedItem(
            sprintId,
            { code: 'INTERNAL_CONTRACT_MISMATCH', message: 'Internal contract mismatch' },
            executedAt,
            solveRequest,
          ),
        );
        continue;
      }

      await registerSucceededSprintRun(sprintId, solveRequest, parsedResponse.data);
      await markSprintSolved(sprintId);
      items.push({
        sprintId,
        executedAt,
        status: 'succeeded',
        inputSnapshot: solveRequest,
        outputSnapshot: parsedResponse.data,
      });
    } catch (error) {
      if (error instanceof EngineRunnerError) {
        const mapped = mapEngineRunnerError(error);
        await registerFailedSprintRun(sprintId, solveRequest, mapped.code, mapped.message);
        items.push(createFailedItem(sprintId, { code: mapped.code, message: mapped.message }, executedAt, solveRequest));
        continue;
      }

      const fallback = new SolverError(500, 'UNEXPECTED_ERROR', 'Unexpected solver failure');
      await registerFailedSprintRun(sprintId, solveRequest, fallback.code, fallback.message);
      items.push(createFailedItem(sprintId, { code: fallback.code, message: fallback.message }, executedAt, solveRequest));
    }
  }

  const run: PlanningCycleRun = {
    id: createPlanningCycleRunId(),
    cycleId,
    executedAt: new Date().toISOString(),
    status: toCycleRunStatus(items),
    items,
  };

  return { run: await appendPlanningCycleRun(run) };
}
