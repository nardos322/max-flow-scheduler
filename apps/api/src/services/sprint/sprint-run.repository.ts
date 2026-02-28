import type { SprintRun } from '@scheduler/domain';

const sprintRunStore = new Map<string, SprintRun[]>();

export function appendSprintRun(run: SprintRun): SprintRun {
  const current = sprintRunStore.get(run.sprintId) ?? [];
  current.push(run);
  sprintRunStore.set(run.sprintId, current);
  return run;
}

export function listSprintRuns(sprintId: string): SprintRun[] {
  return [...(sprintRunStore.get(sprintId) ?? [])].sort((a, b) => a.executedAt.localeCompare(b.executedAt));
}

export function clearSprintRunStore(): void {
  sprintRunStore.clear();
}
