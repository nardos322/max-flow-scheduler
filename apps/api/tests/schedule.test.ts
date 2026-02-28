import { describe, expect, it, vi } from 'vitest';
import { EngineRunnerError } from '../src/services/engine-runner.service.js';
import { createSolveScheduleController } from '../src/controllers/schedule.controller.js';
import { validateSolveRequestMiddleware } from '../src/middlewares/validate-solve-request.middleware.js';

describe('validateSolveRequestMiddleware', () => {
  it('rejects invalid payloads with field issues', async () => {
    const next = vi.fn();
    const res = { locals: {} };

    await validateSolveRequestMiddleware(
      {
        body: {
          doctors: [{ id: 'd1', maxTotalDays: 2 }],
          demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
          availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
        },
      } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
      }),
    );
  });
});

describe('solveScheduleController', () => {
  it('returns the solver response for a valid payload', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const next = vi.fn();
    const res = { status, json, locals: { solveRequest: {} } };
    const solveScheduleController = createSolveScheduleController(async () => ({
      contractVersion: '1.0',
      isFeasible: true,
      assignedCount: 1,
      uncoveredDays: [],
      assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
    }));

    await solveScheduleController(
      {} as never,
      res as never,
      next,
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      contractVersion: '1.0',
      isFeasible: true,
      assignedCount: 1,
      uncoveredDays: [],
      assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards engine errors to error middleware', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const next = vi.fn();
    const res = { status, json, locals: { solveRequest: {} } };
    const solveScheduleController = createSolveScheduleController(async () => {
      throw new EngineRunnerError('boom', 'EXIT_NON_ZERO');
    });

    await solveScheduleController(
      {} as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.any(EngineRunnerError));
    expect(status).not.toHaveBeenCalled();
  });
});
