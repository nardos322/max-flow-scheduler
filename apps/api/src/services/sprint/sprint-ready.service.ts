import type { Sprint } from '@scheduler/domain';
import { getSprintById, saveSprint } from './sprint.repository.js';

export async function markSprintReadyToSolve(sprintId: string): Promise<Sprint | null> {
  const sprint = await getSprintById(sprintId);
  if (!sprint) {
    return null;
  }

  const updated: Sprint = {
    ...sprint,
    status: 'ready-to-solve',
    updatedAt: new Date().toISOString(),
  };

  return saveSprint(updated);
}

export async function markSprintSolved(sprintId: string): Promise<Sprint | null> {
  const sprint = await getSprintById(sprintId);
  if (!sprint) {
    return null;
  }

  const updated: Sprint = {
    ...sprint,
    status: 'solved',
    updatedAt: new Date().toISOString(),
  };

  return saveSprint(updated);
}
