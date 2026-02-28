import { accessSync, constants as fsConstants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import type { SolveRequest } from '@scheduler/domain';
import { createSolveScheduleController } from '../../src/controllers/schedule.controller.js';
import { validateSolveRequestMiddleware } from '../../src/middlewares/validate-solve-request.middleware.js';
import { solveScheduleWithEngine } from '../../src/services/solve-schedule.service.js';

const defaultEngineBinary = fileURLToPath(
  new URL('../../../../services/engine-cpp/build/scheduler_engine', import.meta.url),
);

function hasExecutable(path: string): boolean {
  try {
    accessSync(path, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function asValidRequest(body: SolveRequest) {
  return { body } as never;
}

describe('API-engine integration', () => {
  const engineBinary = process.env.SCHEDULER_ENGINE_BINARY ?? defaultEngineBinary;
  const canRunIntegration = hasExecutable(engineBinary);
  const describeIf = canRunIntegration ? describe : describe.skip;

  describeIf('validate -> controller -> engine', () => {
    it('returns solver response for a feasible payload', async () => {
      process.env.SCHEDULER_ENGINE_BINARY = engineBinary;

      const status = vi.fn().mockReturnThis();
      const json = vi.fn();
      const next = vi.fn();
      const res = { status, json, locals: { requestId: 'integration-req-1' } };

      const body: SolveRequest = {
        contractVersion: '1.0',
        doctors: [{ id: 'd1', maxTotalDays: 1 }],
        periods: [{ id: 'p1', dayIds: ['day-1'] }],
        demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
        availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
      };

      await validateSolveRequestMiddleware(asValidRequest(body), res as never, next);
      expect(next).toHaveBeenCalledWith();

      const solveScheduleController = createSolveScheduleController(solveScheduleWithEngine);
      await solveScheduleController({} as never, res as never, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        contractVersion: '1.0',
        isFeasible: true,
        assignedCount: 1,
        uncoveredDays: [],
        assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
      });
    });

    it('rejects invalid payload before solver execution', async () => {
      const next = vi.fn();
      const res = { locals: { requestId: 'integration-req-2' } };

      await validateSolveRequestMiddleware(
        {
          body: {
            doctors: [{ id: 'd1', maxTotalDays: 1 }],
          },
        } as never,
        res as never,
        next,
      );

      const [error] = next.mock.calls[0] as [Error];
      expect(error).toBeDefined();
      expect((error as { statusCode?: number }).statusCode).toBe(400);
    });
  });
});
