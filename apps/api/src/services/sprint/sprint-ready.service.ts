import type { Sprint } from '@scheduler/domain';
import { getSprintById, saveSprint } from './sprint.repository.js';

export function markSprintReadyToSolve(sprintId: string): Sprint | null {
  const sprint = getSprintById(sprintId);
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

export function markSprintSolved(sprintId: string): Sprint | null {
  const sprint = getSprintById(sprintId);
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
