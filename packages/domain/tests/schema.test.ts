import { describe, expect, it } from 'vitest';
import {
  createSprintRequestSchema,
  solveRequestSchema,
  solveResponseSchema,
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
  it('accepts create sprint payload', () => {
    const result = createSprintRequestSchema.safeParse({
      name: 'Guardias Marzo',
      startsOn: '2026-03-01',
      endsOn: '2026-03-31',
      globalConfig: {
        requiredDoctorsPerShift: 2,
        maxDaysPerDoctorDefault: 8,
      },
      doctors: [{ id: 'd1', maxTotalDaysOverride: 7 }],
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
      startsOn: '2026-03-01',
      endsOn: '2026-03-31',
      status: 'draft',
      globalConfig: {
        requiredDoctorsPerShift: 2,
        maxDaysPerDoctorDefault: 8,
      },
      doctors: [{ id: 'd1' }],
      createdAt: '2026-02-28T10:00:00.000Z',
      updatedAt: '2026-02-28T10:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });
});
