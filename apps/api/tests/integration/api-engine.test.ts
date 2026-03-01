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
const fixturesDir = fileURLToPath(new URL('../../../../packages/domain/fixtures', import.meta.url));

type FixtureCatalogEntry = {
  category: 'happy' | 'edge' | 'invalid' | 'stress';
  id: string;
  requestFile: string;
  expectSchemaValid: boolean;
  expectedSolver?: {
    isFeasible: boolean;
    assignedCount: number;
    uncoveredDaysCount: number;
  };
};

const fixtureCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../../packages/domain/fixtures/catalog.json', import.meta.url)), 'utf8'),
) as FixtureCatalogEntry[];

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
  const fixturePath = `${fixturesDir}/${fileName}`;
  return JSON.parse(readFileSync(fixturePath, 'utf8')) as SolveRequest;
}

describe('API-engine integration', () => {
  const engineBinary = process.env.SCHEDULER_ENGINE_BINARY ?? defaultEngineBinary;
  const canRunIntegration = hasExecutable(engineBinary);
  const describeIf = canRunIntegration ? describe : describe.skip;
  const validFixtures = fixtureCatalog.filter((fixture) => fixture.expectSchemaValid && fixture.expectedSolver);
  const invalidFixtures = fixtureCatalog.filter((fixture) => !fixture.expectSchemaValid);

  describeIf('validate -> controller -> engine', () => {
    it('returns expected outcomes for every valid shared fixture', async () => {
      process.env.SCHEDULER_ENGINE_BINARY = engineBinary;

      for (const fixture of validFixtures) {
        const expected = fixture.expectedSolver;
        if (!expected) {
          throw new Error(`Missing expectedSolver for fixture '${fixture.id}'`);
        }

        const status = vi.fn().mockReturnThis();
        const json = vi.fn();
        const next = vi.fn();
        const res = { status, json, locals: { requestId: `integration-${fixture.id}` } };

        await validateSolveRequestMiddleware(asValidRequest(loadRequestFixture(fixture.requestFile)), res as never, next);
        expect(next, fixture.id).toHaveBeenCalledWith();

        const solveScheduleController = createSolveScheduleController(solveScheduleWithEngine);
        await solveScheduleController({} as never, res as never, next);

        expect(status, fixture.id).toHaveBeenCalledWith(200);
        expect(json, fixture.id).toHaveBeenCalledWith(
          expect.objectContaining({
            contractVersion: '1.0',
            isFeasible: expected.isFeasible,
            assignedCount: expected.assignedCount,
          }),
        );

        const call = json.mock.calls[0]?.[0] as { uncoveredDays: string[] };
        expect(call.uncoveredDays.length, fixture.id).toBe(expected.uncoveredDaysCount);
      }
    });

    it('rejects invalid fixture payloads before solver execution', async () => {
      for (const fixture of invalidFixtures) {
        const next = vi.fn();
        const res = { locals: { requestId: `integration-${fixture.id}` } };

        await validateSolveRequestMiddleware(asValidRequest(loadRequestFixture(fixture.requestFile)), res as never, next);

        const [error] = next.mock.calls[0] as [Error];
        expect(error, fixture.id).toBeDefined();
        expect((error as { statusCode?: number }).statusCode, fixture.id).toBe(400);
      }
    });
  });
});
