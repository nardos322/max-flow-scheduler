import type { CreateSprintRequest, Sprint, SprintGlobalConfig } from '@scheduler/domain';
import { getSprintById, listSprints, saveSprint } from './sprint.repository.js';

function createSprintId(): string {
  return `spr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSprint(payload: CreateSprintRequest): Sprint {
  const timestamp = new Date().toISOString();

  const sprint: Sprint = {
    id: createSprintId(),
    name: payload.name,
    startsOn: payload.startsOn,
    endsOn: payload.endsOn,
    status: 'draft',
    globalConfig: payload.globalConfig,
    doctors: payload.doctors,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return saveSprint(sprint);
}

export function findSprintOrNull(sprintId: string): Sprint | null {
  return getSprintById(sprintId);
}

export function getAllSprints(): Sprint[] {
  return listSprints();
}

export function updateSprintGlobalConfig(sprintId: string, globalConfig: SprintGlobalConfig): Sprint | null {
  const sprint = getSprintById(sprintId);
  if (!sprint) {
    return null;
  }

  const updated: Sprint = {
    ...sprint,
    globalConfig,
    updatedAt: new Date().toISOString(),
  };

  return saveSprint(updated);
}
