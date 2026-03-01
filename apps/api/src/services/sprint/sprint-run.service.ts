import type { SolveRequest, SolveResponse, SprintRun } from '@scheduler/domain';
import { appendSprintRun, listSprintRuns } from './sprint-run.repository.js';
import { getDoctorById } from '../doctor/doctor.service.js';
import { getPeriodById } from '../period/period.service.js';
import { getSprintById } from './sprint.repository.js';

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

function buildInclusiveDayRange(startsOn: string, endsOn: string): string[] {
  const dayIds: string[] = [];
  const cursor = new Date(`${startsOn}T00:00:00.000Z`);
  const end = new Date(`${endsOn}T00:00:00.000Z`);

  while (cursor.getTime() <= end.getTime()) {
    dayIds.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dayIds;
}

export type BuildSolveRequestFromSprintResult =
  | { request: SolveRequest }
  | {
      error:
        | 'SPRINT_NOT_FOUND'
        | 'PERIOD_NOT_FOUND'
        | 'DOCTOR_NOT_FOUND_OR_INACTIVE'
        | 'NO_DOCTORS'
        | 'NO_AVAILABILITY'
        | 'NO_PERIOD_DAYS';
      details?: string[];
    };

export async function buildSolveRequestFromSprint(sprintId: string): Promise<BuildSolveRequestFromSprintResult> {
  const sprint = await getSprintById(sprintId);
  if (!sprint) {
    return { error: 'SPRINT_NOT_FOUND' };
  }

  if (sprint.doctorIds.length === 0) {
    return { error: 'NO_DOCTORS' };
  }

  const period = await getPeriodById(sprint.periodId);
  if (!period) {
    return { error: 'PERIOD_NOT_FOUND' };
  }

  const dayIds = buildInclusiveDayRange(period.startsOn, period.endsOn);
  if (dayIds.length === 0) {
    return { error: 'NO_PERIOD_DAYS' };
  }

  const doctors: SolveRequest['doctors'] = [];
  const missingOrInactive: string[] = [];
  for (const doctorId of sprint.doctorIds) {
    const doctor = await getDoctorById(doctorId);
    if (!doctor || !doctor.active) {
      missingOrInactive.push(doctorId);
      continue;
    }

    doctors.push({
      id: doctor.id,
      maxTotalDays: doctor.maxTotalDaysDefault ?? sprint.globalConfig.maxDaysPerDoctorDefault,
    });
  }

  if (missingOrInactive.length > 0) {
    return { error: 'DOCTOR_NOT_FOUND_OR_INACTIVE', details: missingOrInactive };
  }

  const demandByDay = new Map(period.demands.map((demand) => [demand.dayId, demand.requiredDoctors]));
  const demands: SolveRequest['demands'] = dayIds.map((dayId) => ({
    dayId,
    requiredDoctors: demandByDay.get(dayId) ?? sprint.globalConfig.requiredDoctorsPerShift,
  }));

  const availability = sprint.availability
    .filter((entry) => entry.periodId === sprint.periodId && sprint.doctorIds.includes(entry.doctorId))
    .map((entry) => ({
      doctorId: entry.doctorId,
      periodId: entry.periodId,
      dayId: entry.dayId,
    }));

  if (availability.length === 0) {
    return { error: 'NO_AVAILABILITY' };
  }

  return {
    request: {
      contractVersion: '1.0',
      doctors,
      periods: [{ id: period.id, dayIds }],
      demands,
      availability,
    },
  };
}
