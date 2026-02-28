import type {
  AvailabilityDay,
  CreateSprintRequest,
  Sprint,
  SprintAvailabilityEntry,
  SprintGlobalConfig,
  UserRole,
} from '@scheduler/domain';
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
    availability: [],
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

export type UpdateDoctorAvailabilityResult =
  | { sprint: Sprint }
  | { error: 'SPRINT_NOT_FOUND' | 'DOCTOR_NOT_FOUND' };

export function updateDoctorAvailability(
  sprintId: string,
  doctorId: string,
  days: AvailabilityDay[],
  actor: { role: UserRole; userId: string },
): UpdateDoctorAvailabilityResult {
  const sprint = getSprintById(sprintId);
  if (!sprint) {
    return { error: 'SPRINT_NOT_FOUND' };
  }

  const doctorExists = sprint.doctors.some((doctor) => doctor.id === doctorId);
  if (!doctorExists) {
    return { error: 'DOCTOR_NOT_FOUND' };
  }

  const source: SprintAvailabilityEntry['source'] =
    actor.role === 'planner' ? 'planner-override' : 'doctor-self-service';
  const updatedAt = new Date().toISOString();

  const entries: SprintAvailabilityEntry[] = days.map((entry) => ({
    doctorId,
    periodId: entry.periodId,
    dayId: entry.dayId,
    source,
    updatedByUserId: actor.userId,
    updatedByRole: actor.role,
    updatedAt,
  }));

  const updated: Sprint = {
    ...sprint,
    availability: [...sprint.availability.filter((item) => item.doctorId !== doctorId), ...entries],
    updatedAt,
  };

  return { sprint: saveSprint(updated) };
}

export function getSprintAvailability(sprintId: string): SprintAvailabilityEntry[] | null {
  const sprint = getSprintById(sprintId);
  if (!sprint) {
    return null;
  }

  return [...sprint.availability];
}
