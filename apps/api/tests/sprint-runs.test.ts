import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createRunSprintSolveController,
  listSprintRunsController,
  markSprintReadyController,
  runSprintSolveController,
} from '../src/controllers/sprint/sprint-run.controller.js';
import { createSprintController } from '../src/controllers/sprint/sprint.controller.js';
import { validateCreateSprintMiddleware } from '../src/middlewares/sprint/validate-sprint.middleware.js';
import { clearSprintStore } from '../src/services/sprint/sprint.repository.js';
import { clearSprintRunStore } from '../src/services/sprint/sprint-run.repository.js';

describe('sprint run controllers', () => {
  beforeEach(() => {
    clearSprintStore();
    clearSprintRunStore();
  });

  it('requires sprint to be ready before solving', async () => {
    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateCreateSprintMiddleware(
      {
        body: {
          name: 'Guardias Mayo',
          startsOn: '2026-05-01',
          endsOn: '2026-05-31',
          globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 8 },
          doctors: [{ id: 'd1' }],
        },
      } as never,
      createRes as never,
      next,
    );
    await createSprintController({} as never, createRes as never, next);

    const createdCall = createRes.json.mock.calls[0];
    if (!createdCall) {
      throw new Error('Expected sprint create response');
    }
    const created = createdCall[0] as { id: string };

    const solveRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: { runSolveRequest: {
      request: {
        contractVersion: '1.0',
        doctors: [{ id: 'd1', maxTotalDays: 1 }],
        periods: [{ id: 'p1', dayIds: ['day-1'] }],
        demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
        availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
      },
    } } };

    await runSprintSolveController({ params: { sprintId: created.id } } as never, solveRes as never, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
  });

  it('marks sprint ready, runs solve, and stores run history', async () => {
    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateCreateSprintMiddleware(
      {
        body: {
          name: 'Guardias Junio',
          startsOn: '2026-06-01',
          endsOn: '2026-06-30',
          globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 8 },
          doctors: [{ id: 'd1' }],
        },
      } as never,
      createRes as never,
      next,
    );
    await createSprintController({} as never, createRes as never, next);

    const createdCall = createRes.json.mock.calls[0];
    if (!createdCall) {
      throw new Error('Expected sprint create response');
    }
    const created = createdCall[0] as { id: string };

    const markReadyRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: { markReadyRequest: { status: 'ready-to-solve' } } };
    await markSprintReadyController({ params: { sprintId: created.id } } as never, markReadyRes as never, next);
    expect(markReadyRes.status).toHaveBeenCalledWith(200);

    const solveRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      locals: {
        runSolveRequest: {
          request: {
            contractVersion: '1.0',
            doctors: [{ id: 'd1', maxTotalDays: 1 }],
            periods: [{ id: 'p1', dayIds: ['day-1'] }],
            demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
            availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
          },
        },
      },
    };

    const runSolveWithSuccess = createRunSprintSolveController(async () => ({
      contractVersion: '1.0',
      isFeasible: true,
      assignedCount: 1,
      uncoveredDays: [],
      assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
    }));

    await runSolveWithSuccess({ params: { sprintId: created.id } } as never, solveRes as never, next);
    expect(solveRes.status).toHaveBeenCalledWith(200);

    const historyRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await listSprintRunsController({ params: { sprintId: created.id } } as never, historyRes as never, next);

    expect(historyRes.status).toHaveBeenCalledWith(200);
    expect(historyRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            sprintId: created.id,
            status: 'succeeded',
          }),
        ]),
      }),
    );
  });
});
