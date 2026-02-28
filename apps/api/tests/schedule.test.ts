import { describe, expect, it, vi } from 'vitest';
import { createSolveScheduleHandler } from '../src/app.js';
import { EngineRunnerError } from '../src/engine-runner.js';

describe('solveScheduleHandler', () => {
  it('rejects invalid payloads with field issues', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json };

    const solveScheduleHandler = createSolveScheduleHandler(vi.fn());

    await solveScheduleHandler(
      {
        body: {
          doctors: [{ id: 'd1', maxTotalDays: 2 }],
          demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
          availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
        },
      } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid schedule payload',
        issues: expect.any(Array),
      }),
    );
  });

  it('returns the solver response for a valid payload', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json };
    const solveScheduleHandler = createSolveScheduleHandler(async () => ({
      contractVersion: '1.0',
      isFeasible: true,
      assignedCount: 1,
      uncoveredDays: [],
      assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
    }));

    await solveScheduleHandler(
      {
        body: {
          contractVersion: '1.0',
          doctors: [{ id: 'd1', maxTotalDays: 2 }],
          periods: [{ id: 'p1', dayIds: ['day-1'] }],
          demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
          availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
        },
      } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      contractVersion: '1.0',
      isFeasible: true,
      assignedCount: 1,
      uncoveredDays: [],
      assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
    });
  });

  it('maps engine client failures to 500 solver execution error', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json };
    const solveScheduleHandler = createSolveScheduleHandler(async () => {
      throw new EngineRunnerError('boom', 'EXIT_NON_ZERO');
    });

    await solveScheduleHandler(
      {
        body: {
          contractVersion: '1.0',
          doctors: [{ id: 'd1', maxTotalDays: 2 }],
          periods: [{ id: 'p1', dayIds: ['day-1'] }],
          demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
          availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
        },
      } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: 'Solver execution failed',
      details: 'EXIT_NON_ZERO',
    });
  });
});
