import type { Sprint } from '@scheduler/domain';
import { getDoctorById } from '../doctor/doctor.service.js';
import { getPeriodById } from '../period/period.service.js';
import { getSprintById, saveSprint } from './sprint.repository.js';

export type MarkSprintReadyResult =
  | { sprint: Sprint }
  | {
      error:
        | 'SPRINT_NOT_FOUND'
        | 'PERIOD_NOT_FOUND'
        | 'NO_DOCTORS'
        | 'DOCTOR_NOT_FOUND_OR_INACTIVE'
        | 'NO_AVAILABILITY';
      details?: string[];
    };

export async function markSprintReadyToSolve(sprintId: string): Promise<MarkSprintReadyResult> {
  const sprint = await getSprintById(sprintId);
  if (!sprint) {
    return { error: 'SPRINT_NOT_FOUND' };
  }

  const period = await getPeriodById(sprint.periodId);
  if (!period) {
    return { error: 'PERIOD_NOT_FOUND' };
  }

  if (sprint.doctorIds.length === 0) {
    return { error: 'NO_DOCTORS' };
  }

  const missingOrInactive: string[] = [];
  for (const doctorId of sprint.doctorIds) {
    const doctor = await getDoctorById(doctorId);
    if (!doctor || !doctor.active) {
      missingOrInactive.push(doctorId);
    }
  }
  if (missingOrInactive.length > 0) {
    return { error: 'DOCTOR_NOT_FOUND_OR_INACTIVE', details: missingOrInactive };
  }

  const hasAvailability = sprint.availability.some(
    (entry) => entry.periodId === sprint.periodId && sprint.doctorIds.includes(entry.doctorId),
  );
  if (!hasAvailability) {
    return { error: 'NO_AVAILABILITY' };
  }

  const updated: Sprint = {
    ...sprint,
    status: 'ready-to-solve',
    updatedAt: new Date().toISOString(),
  };

  return { sprint: await saveSprint(updated) };
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
