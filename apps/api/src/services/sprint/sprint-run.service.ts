import type { SolveRequest, SolveResponse, SprintRun } from '@scheduler/domain';
import { appendSprintRun, listSprintRuns } from './sprint-run.repository.js';

function createRunId(): string {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function registerSucceededSprintRun(
  sprintId: string,
  inputSnapshot: SolveRequest,
  outputSnapshot: SolveResponse,
): Promise<SprintRun> {
  const run: SprintRun = {
    id: createRunId(),
    sprintId,
    executedAt: new Date().toISOString(),
    status: 'succeeded',
    inputSnapshot,
    outputSnapshot,
  };

  return appendSprintRun(run);
}

export function registerFailedSprintRun(
  sprintId: string,
  inputSnapshot: SolveRequest,
  code: string,
  message: string,
): Promise<SprintRun> {
  const run: SprintRun = {
    id: createRunId(),
    sprintId,
    executedAt: new Date().toISOString(),
    status: 'failed',
    inputSnapshot,
    error: {
      code,
      message,
    },
  };

  return appendSprintRun(run);
}

export function getSprintRunHistory(sprintId: string): Promise<SprintRun[]> {
  return listSprintRuns(sprintId);
}
