import type { Sprint } from '@scheduler/domain';

const sprintStore = new Map<string, Sprint>();

export function saveSprint(sprint: Sprint): Sprint {
  sprintStore.set(sprint.id, sprint);
  return sprint;
}

export function getSprintById(id: string): Sprint | null {
  return sprintStore.get(id) ?? null;
}

export function listSprints(): Sprint[] {
  return [...sprintStore.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function clearSprintStore(): void {
  sprintStore.clear();
}
