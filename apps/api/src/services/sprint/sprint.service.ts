import type {
  AvailabilityDay,
  CreateSprintRequest,
  Sprint,
  SprintAvailabilityEntry,
  SprintGlobalConfig,
  UserRole,
} from '@scheduler/domain';
import { ensureActiveDoctorsOrMissing } from '../doctor/doctor.service.js';
import { getPeriodById } from '../period/period.service.js';
import { getSprintById, listSprints, saveSprint } from './sprint.repository.js';

function createSprintId(): string {
  return `spr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createSprint(payload: CreateSprintRequest): Promise<Sprint> {
  const timestamp = new Date().toISOString();
  const period = await getPeriodById(payload.periodId);
  if (!period) {
    throw new Error('PERIOD_NOT_FOUND');
  }

  const doctorCheck = await ensureActiveDoctorsOrMissing(payload.doctorIds);
  if (doctorCheck.missing.length > 0) {
    throw new Error(`DOCTORS_NOT_FOUND:${doctorCheck.missing.join(',')}`);
  }

  const sprint: Sprint = {
    id: createSprintId(),
    name: payload.name,
    periodId: payload.periodId,
    status: 'draft',
    globalConfig: payload.globalConfig,
    doctorIds: payload.doctorIds,
    availability: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return saveSprint(sprint);
}

export async function findSprintOrNull(sprintId: string): Promise<Sprint | null> {
  return getSprintById(sprintId);
}

export async function getAllSprints(): Promise<Sprint[]> {
  return listSprints();
}

export async function updateSprintGlobalConfig(
  sprintId: string,
  globalConfig: SprintGlobalConfig,
): Promise<Sprint | null> {
  const sprint = await getSprintById(sprintId);
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
  | { error: 'SPRINT_NOT_FOUND' | 'DOCTOR_NOT_FOUND' | 'PERIOD_NOT_FOUND' | 'PERIOD_MISMATCH' | 'DAY_OUT_OF_RANGE' };

export async function updateDoctorAvailability(
  sprintId: string,
  doctorId: string,
  days: AvailabilityDay[],
  actor: { role: UserRole; userId: string },
): Promise<UpdateDoctorAvailabilityResult> {
  const sprint = await getSprintById(sprintId);
  if (!sprint) {
    return { error: 'SPRINT_NOT_FOUND' };
  }

  const doctorExists = sprint.doctorIds.includes(doctorId);
  if (!doctorExists) {
    return { error: 'DOCTOR_NOT_FOUND' };
  }

  const period = await getPeriodById(sprint.periodId);
  if (!period) {
    return { error: 'PERIOD_NOT_FOUND' };
  }

  const mismatch = days.some((day) => day.periodId !== sprint.periodId);
  if (mismatch) {
    return { error: 'PERIOD_MISMATCH' };
  }

  const outOfRange = days.some((day) => day.dayId < period.startsOn || day.dayId > period.endsOn);
  if (outOfRange) {
    return { error: 'DAY_OUT_OF_RANGE' };
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

  return { sprint: await saveSprint(updated) };
}

export async function getSprintAvailability(sprintId: string): Promise<SprintAvailabilityEntry[] | null> {
  const sprint = await getSprintById(sprintId);
  if (!sprint) {
    return null;
  }

  return [...sprint.availability];
}
