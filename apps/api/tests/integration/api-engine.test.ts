import { accessSync, constants as fsConstants, readFileSync } from 'node:fs';
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

function loadRequestFixture(fileName: string): SolveRequest {
  const fixturePath = fileURLToPath(
    new URL(`../../../../packages/domain/fixtures/${fileName}`, import.meta.url),
  );
  return JSON.parse(readFileSync(fixturePath, 'utf8')) as SolveRequest;
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

      const body = loadRequestFixture('happy.basic.request.json');

      await validateSolveRequestMiddleware(asValidRequest(body), res as never, next);
      expect(next).toHaveBeenCalledWith();

      const solveScheduleController = createSolveScheduleController(solveScheduleWithEngine);
      await solveScheduleController({} as never, res as never, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          contractVersion: '1.0',
          isFeasible: true,
          assignedCount: 2,
          uncoveredDays: [],
        }),
      );
    });

    it('handles edge fixture with one doctor across multiple periods', async () => {
      process.env.SCHEDULER_ENGINE_BINARY = engineBinary;

      const status = vi.fn().mockReturnThis();
      const json = vi.fn();
      const next = vi.fn();
      const res = { status, json, locals: { requestId: 'integration-req-2' } };

      await validateSolveRequestMiddleware(
        asValidRequest(loadRequestFixture('edge.one-doctor-multi-period.request.json')),
        res as never,
        next,
      );
      expect(next).toHaveBeenCalledWith();

      const solveScheduleController = createSolveScheduleController(solveScheduleWithEngine);
      await solveScheduleController({} as never, res as never, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          contractVersion: '1.0',
          isFeasible: true,
          assignedCount: 2,
        }),
      );
    });

    it('rejects invalid fixture payload before solver execution', async () => {
      const next = vi.fn();
      const res = { locals: { requestId: 'integration-req-3' } };

      await validateSolveRequestMiddleware(
        asValidRequest(loadRequestFixture('invalid.duplicate-doctor.request.json')),
        res as never,
        next,
      );

      const [error] = next.mock.calls[0] as [Error];
      expect(error).toBeDefined();
      expect((error as { statusCode?: number }).statusCode).toBe(400);
    });
  });
});
