import { describe, expect, it, vi } from 'vitest';
import { EngineRunnerError } from '../src/services/engine-runner.service.js';
import { createSolveScheduleController } from '../src/controllers/schedule.controller.js';
import { validateSolveRequestMiddleware } from '../src/middlewares/validate-solve-request.middleware.js';
import { SolverError } from '../src/errors/solver.error.js';

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

  it('maps engine semantic errors to 422 solver errors', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const next = vi.fn();
    const res = { status, json, locals: { solveRequest: {} } };
    const solveScheduleController = createSolveScheduleController(async () => {
      throw new EngineRunnerError('boom', 'EXIT_NON_ZERO', 'json parse error');
    });

    await solveScheduleController(
      {} as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.any(SolverError));
    const [error] = next.mock.calls[0] as [SolverError];
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('SOLVER_UNPROCESSABLE');
    expect(error.message).toBe('Solver rejected payload');
    expect(status).not.toHaveBeenCalled();
  });

  it('maps engine technical failures to 500 solver errors', async () => {
    const next = vi.fn();
    const res = { locals: { solveRequest: {} } };
    const solveScheduleController = createSolveScheduleController(async () => {
      throw new EngineRunnerError('boom', 'TIMEOUT');
    });

    await solveScheduleController(
      {} as never,
      res as never,
      next,
    );

    const [error] = next.mock.calls[0] as [SolverError];
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('TIMEOUT');
    expect(error.message).toBe('Solver timed out');
  });

  it('returns 500 when solver response breaks contract', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const next = vi.fn();
    const res = { status, json, locals: { solveRequest: {} } };
    const solveScheduleController = createSolveScheduleController(async () => ({
      contractVersion: '1.0',
      isFeasible: true,
      uncoveredDays: [],
      assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
    }));

    await solveScheduleController({} as never, res as never, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
    expect(status).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });
});
