import { describe, expect, it } from 'vitest';
import {
  createDoctorRequestSchema,
  createPeriodRequestSchema,
  createSprintRequestSchema,
  addSprintDoctorRequestSchema,
  doctorCatalogSchema,
  markSprintReadyRequestSchema,
  planningCycleListResponseSchema,
  planningCycleRunListResponseSchema,
  planningCycleRunSchema,
  planningCycleSchema,
  createPlanningCycleRequestSchema,
  addPlanningCycleSprintRequestSchema,
  runPlanningCycleRequestSchema,
  periodCatalogSchema,
  plannerOverrideAvailabilityRequestSchema,
  replacePeriodDemandsRequestSchema,
  runSprintSolveRequestSchema,
  sprintListResponseSchema,
  sprintRunListResponseSchema,
  setDoctorAvailabilityRequestSchema,
  solveRequestSchema,
  solveResponseSchema,
  sprintRunSchema,
  sprintSchema,
  updateSprintGlobalConfigRequestSchema,
} from '../src/index.js';

describe('solveRequestSchema', () => {
  const validRequest = {
    contractVersion: '1.0' as const,
    doctors: [{ id: 'd1', maxTotalDays: 2 }],
    periods: [{ id: 'p1', dayIds: ['day-1'] }],
    demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
    availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
  };

  it('accepts a minimal valid payload', () => {
    const result = solveRequestSchema.safeParse(validRequest);

    expect(result.success).toBe(true);
  });

  it('rejects payload without periods', () => {
    const result = solveRequestSchema.safeParse({
      doctors: [{ id: 'd1', maxTotalDays: 2 }],
      demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
      availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects duplicate doctor ids', () => {
    const result = solveRequestSchema.safeParse({
      ...validRequest,
      doctors: [
        { id: 'd1', maxTotalDays: 2 },
        { id: 'd1', maxTotalDays: 1 },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes('Duplicate doctor id'))).toBe(true);
  });

  it('rejects duplicated demand day', () => {
    const result = solveRequestSchema.safeParse({
      ...validRequest,
      demands: [
        { dayId: 'day-1', requiredDoctors: 1 },
        { dayId: 'day-1', requiredDoctors: 2 },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes('Duplicate demand'))).toBe(true);
  });

  it('rejects availability with unknown doctor', () => {
    const result = solveRequestSchema.safeParse({
      ...validRequest,
      availability: [{ doctorId: 'missing', periodId: 'p1', dayId: 'day-1' }],
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path.join('.') === 'availability.0.doctorId'),
    ).toBe(true);
  });

  it('rejects availability day that is outside period days', () => {
    const result = solveRequestSchema.safeParse({
      ...validRequest,
      availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-2' }],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes('is not part of period'))).toBe(
      true,
    );
  });

  it('rejects demand day not declared in any period', () => {
    const result = solveRequestSchema.safeParse({
      ...validRequest,
      demands: [{ dayId: 'day-x', requiredDoctors: 1 }],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes('not declared in any period'))).toBe(
      true,
    );
  });
});

describe('solveResponseSchema', () => {
  it('accepts response with minCut diagnostics', () => {
    const result = solveResponseSchema.safeParse({
      contractVersion: '1.0',
      isFeasible: false,
      assignedCount: 1,
      uncoveredDays: ['day-2'],
      assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
      minCut: {
        value: 1,
        reachableNodes: ['source', 'doctor:d1'],
        cutEdges: [{ from: 'doctor:d1', to: 'day:day-2', capacity: 1 }],
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid minCut capacity', () => {
    const result = solveResponseSchema.safeParse({
      isFeasible: true,
      assignedCount: 1,
      uncoveredDays: [],
      assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
      minCut: {
        value: 1,
        reachableNodes: ['source'],
        cutEdges: [{ from: 'x', to: 'y', capacity: -1 }],
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('sprint schemas', () => {
  it('accepts doctor catalog entity', () => {
    const result = doctorCatalogSchema.safeParse({
      id: 'doc-1',
      name: 'Dr. House',
      active: true,
      maxTotalDaysDefault: 8,
      createdAt: '2026-02-28T10:00:00.000Z',
      updatedAt: '2026-02-28T10:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('accepts create doctor payload', () => {
    const result = createDoctorRequestSchema.safeParse({
      name: 'Dr. Wilson',
      active: true,
      maxTotalDaysDefault: 6,
    });

    expect(result.success).toBe(true);
  });

  it('accepts period catalog entity', () => {
    const result = periodCatalogSchema.safeParse({
      id: 'per-1',
      name: 'Marzo 2026',
      startsOn: '2026-03-01',
      endsOn: '2026-03-31',
      demands: [{ dayId: '2026-03-01', requiredDoctors: 2 }],
      createdAt: '2026-02-28T10:00:00.000Z',
      updatedAt: '2026-02-28T10:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects period demand day out of range', () => {
    const result = createPeriodRequestSchema.safeParse({
      name: 'Marzo 2026',
      startsOn: '2026-03-01',
      endsOn: '2026-03-31',
      demands: [{ dayId: '2026-04-01', requiredDoctors: 2 }],
    });

    expect(result.success).toBe(false);
  });

  it('accepts replace period demands payload', () => {
    const result = replacePeriodDemandsRequestSchema.safeParse({
      demands: [{ dayId: '2026-03-03', requiredDoctors: 2 }],
    });

    expect(result.success).toBe(true);
  });

  it('accepts create sprint payload', () => {
    const result = createSprintRequestSchema.safeParse({
      name: 'Guardias Marzo',
      periodId: 'per-1',
      globalConfig: {
        requiredDoctorsPerShift: 2,
        maxDaysPerDoctorDefault: 8,
      },
      doctorIds: ['doc-1'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid global config update', () => {
    const result = updateSprintGlobalConfigRequestSchema.safeParse({
      globalConfig: {
        requiredDoctorsPerShift: 0,
        maxDaysPerDoctorDefault: 8,
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts persisted sprint entity', () => {
    const result = sprintSchema.safeParse({
      id: 'spr-1',
      name: 'Guardias Marzo',
      periodId: 'per-1',
      status: 'draft',
      globalConfig: {
        requiredDoctorsPerShift: 2,
        maxDaysPerDoctorDefault: 8,
      },
      doctorIds: ['doc-1'],
      availability: [],
      createdAt: '2026-02-28T10:00:00.000Z',
      updatedAt: '2026-02-28T10:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('accepts sprint run snapshot entity', () => {
    const result = sprintRunSchema.safeParse({
      id: 'run-1',
      sprintId: 'spr-1',
      executedAt: '2026-02-28T10:00:00.000Z',
      status: 'succeeded',
      inputSnapshot: {
        contractVersion: '1.0',
        doctors: [{ id: 'd1', maxTotalDays: 2 }],
        periods: [{ id: 'p1', dayIds: ['day-1'] }],
        demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
        availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
      },
      outputSnapshot: {
        contractVersion: '1.0',
        isFeasible: true,
        assignedCount: 1,
        uncoveredDays: [],
        assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts mark sprint ready payload', () => {
    const result = markSprintReadyRequestSchema.safeParse({ status: 'ready-to-solve' });
    expect(result.success).toBe(true);
  });

  it('accepts run sprint solve payload', () => {
    const result = runSprintSolveRequestSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('accepts add sprint doctor payload', () => {
    const result = addSprintDoctorRequestSchema.safeParse({ doctorId: 'doc-1' });
    expect(result.success).toBe(true);
  });

  it('accepts doctor self-service availability payload', () => {
    const result = setDoctorAvailabilityRequestSchema.safeParse({
      availability: [
        { periodId: 'p1', dayId: 'day-1' },
        { periodId: 'p1', dayId: 'day-2' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects duplicate day in doctor self-service availability payload', () => {
    const result = setDoctorAvailabilityRequestSchema.safeParse({
      availability: [
        { periodId: 'p1', dayId: 'day-1' },
        { periodId: 'p1', dayId: 'day-1' },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('accepts planner override availability payload', () => {
    const result = plannerOverrideAvailabilityRequestSchema.safeParse({
      doctorId: 'd1',
      availability: [{ periodId: 'p1', dayId: 'day-3' }],
    });

    expect(result.success).toBe(true);
  });

  it('accepts sprint list response with cursor', () => {
    const result = sprintListResponseSchema.safeParse({
      items: [],
      nextCursor: '2026-03-01T10:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('accepts sprint run list response with cursor', () => {
    const result = sprintRunListResponseSchema.safeParse({
      items: [],
      nextCursor: '2026-03-01T10:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('accepts planning cycle payloads and entities', () => {
    const createResult = createPlanningCycleRequestSchema.safeParse({ name: 'Q2 Plan' });
    expect(createResult.success).toBe(true);

    const addSprintResult = addPlanningCycleSprintRequestSchema.safeParse({
      sprintId: 'spr-1',
      orderIndex: 1,
    });
    expect(addSprintResult.success).toBe(true);

    const cycleResult = planningCycleSchema.safeParse({
      id: 'cyc-1',
      name: 'Q2 Plan',
      status: 'draft',
      sprintIds: ['spr-1'],
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    });
    expect(cycleResult.success).toBe(true);

    const runResult = planningCycleRunSchema.safeParse({
      id: 'cycle-run-1',
      cycleId: 'cyc-1',
      executedAt: '2026-03-01T10:01:00.000Z',
      status: 'partial-failed',
      items: [
        {
          sprintId: 'spr-1',
          executedAt: '2026-03-01T10:01:00.000Z',
          status: 'failed',
          error: { code: 'SPRINT_NOT_READY', message: 'Sprint is not ready to solve' },
        },
      ],
    });
    expect(runResult.success).toBe(true);

    const runReqResult = runPlanningCycleRequestSchema.safeParse({});
    expect(runReqResult.success).toBe(true);

    const cycleListResult = planningCycleListResponseSchema.safeParse({
      items: [],
      nextCursor: '2026-03-01T10:00:00.000Z',
    });
    expect(cycleListResult.success).toBe(true);

    const cycleRunListResult = planningCycleRunListResponseSchema.safeParse({
      items: [],
      nextCursor: '2026-03-01T10:00:00.000Z',
    });
    expect(cycleRunListResult.success).toBe(true);
  });
});
