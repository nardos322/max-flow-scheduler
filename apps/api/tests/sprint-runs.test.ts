import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SolveResponse } from '@scheduler/domain';
import {
  createRunSprintSolveController,
  listSprintRunsController,
  markSprintReadyController,
  runSprintSolveController,
} from '../src/controllers/sprint/sprint-run.controller.js';
import { createSprintController } from '../src/controllers/sprint/sprint.controller.js';
import { validateCreateSprintMiddleware } from '../src/middlewares/sprint/validate-sprint.middleware.js';
import { clearDoctorStore, createDoctor } from '../src/services/doctor/doctor.repository.js';
import { clearPeriodStore, createPeriod } from '../src/services/period/period.repository.js';
import { clearSprintStore } from '../src/services/sprint/sprint.repository.js';
import { updateDoctorAvailability } from '../src/services/sprint/sprint.service.js';
import { clearSprintRunStore } from '../src/services/sprint/sprint-run.repository.js';

describe('sprint run controllers', () => {
  beforeEach(async () => {
    await clearSprintRunStore();
    await clearSprintStore();
    await clearDoctorStore();
    await clearPeriodStore();
  });

  it('requires sprint to be ready before solving', async () => {
    const doctor = await createDoctor({ name: 'Dr. Uno', active: true, maxTotalDaysDefault: 8 });
    const period = await createPeriod({
      name: 'Mayo 2026',
      startsOn: '2026-05-01',
      endsOn: '2026-05-31',
      demands: [{ dayId: '2026-05-01', requiredDoctors: 1 }],
    });

    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateCreateSprintMiddleware(
      {
        body: {
          name: 'Guardias Mayo',
          periodId: period.id,
          globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 8 },
          doctorIds: [doctor.id],
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

    const solveRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await runSprintSolveController({ params: { sprintId: created.id } } as never, solveRes as never, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
  });

  it('marks sprint ready, runs solve, and stores run history', async () => {
    const doctor = await createDoctor({ name: 'Dr. Uno', active: true, maxTotalDaysDefault: 8 });
    const period = await createPeriod({
      name: 'Junio 2026',
      startsOn: '2026-06-01',
      endsOn: '2026-06-30',
      demands: [{ dayId: '2026-06-01', requiredDoctors: 1 }],
    });

    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateCreateSprintMiddleware(
      {
        body: {
          name: 'Guardias Junio',
          periodId: period.id,
          globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 8 },
          doctorIds: [doctor.id],
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

    await updateDoctorAvailability(
      created.id,
      doctor.id,
      [{ periodId: period.id, dayId: '2026-06-01' }],
      { role: 'planner', userId: 'planner-1' },
    );

    const solveRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    const runSolveWithSuccess = createRunSprintSolveController(async () => ({
      contractVersion: '1.0',
      isFeasible: true,
      assignedCount: 1,
      uncoveredDays: [],
      assignments: [{ doctorId: doctor.id, dayId: '2026-06-01', periodId: period.id }],
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

  it('stores failed run when solver response mismatches shared contract', async () => {
    const doctor = await createDoctor({ name: 'Dr. Uno', active: true, maxTotalDaysDefault: 8 });
    const period = await createPeriod({
      name: 'Julio 2026',
      startsOn: '2026-07-01',
      endsOn: '2026-07-31',
      demands: [{ dayId: '2026-07-01', requiredDoctors: 1 }],
    });

    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateCreateSprintMiddleware(
      {
        body: {
          name: 'Guardias Contrato',
          periodId: period.id,
          globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 8 },
          doctorIds: [doctor.id],
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

    await updateDoctorAvailability(
      created.id,
      doctor.id,
      [{ periodId: period.id, dayId: '2026-07-01' }],
      { role: 'planner', userId: 'planner-1' },
    );

    const solveRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    const runSolveWithInvalidContract = createRunSprintSolveController(async () =>
      ({
        contractVersion: '1.0',
        isFeasible: true,
        uncoveredDays: [],
        assignments: [{ doctorId: doctor.id, dayId: '2026-07-01', periodId: period.id }],
      }) as unknown as SolveResponse,
    );

    await runSolveWithInvalidContract({ params: { sprintId: created.id } } as never, solveRes as never, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
    expect(solveRes.status).not.toHaveBeenCalled();

    const historyRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await listSprintRunsController({ params: { sprintId: created.id } } as never, historyRes as never, next);

    expect(historyRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            sprintId: created.id,
            status: 'failed',
            error: expect.objectContaining({
              code: 'INTERNAL_CONTRACT_MISMATCH',
              message: 'Internal contract mismatch',
            }),
          }),
        ]),
      }),
    );
  });
});
