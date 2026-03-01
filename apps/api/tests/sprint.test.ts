import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addSprintDoctorController,
  createSprintController,
  getSprintController,
  listSprintsController,
  removeSprintDoctorController,
  updateSprintGlobalConfigController,
} from '../src/controllers/sprint/sprint.controller.js';
import {
  validateAddSprintDoctorMiddleware,
  validateCreateSprintMiddleware,
  validateUpdateSprintGlobalConfigMiddleware,
} from '../src/middlewares/sprint/validate-sprint.middleware.js';
import { markSprintReadyController } from '../src/controllers/sprint/sprint-run.controller.js';
import { updateDoctorAvailability } from '../src/services/sprint/sprint.service.js';
import { createDoctor, clearDoctorStore } from '../src/services/doctor/doctor.repository.js';
import { clearPeriodStore, createPeriod } from '../src/services/period/period.repository.js';
import { clearSprintStore } from '../src/services/sprint/sprint.repository.js';

describe('sprint controllers', () => {
  beforeEach(async () => {
    await clearSprintStore();
    await clearDoctorStore();
    await clearPeriodStore();
  });

  it('creates and fetches a sprint', async () => {
    const doctor = await createDoctor({ name: 'Dr. Uno', active: true, maxTotalDaysDefault: 8 });
    const period = await createPeriod({
      name: 'Marzo 2026',
      startsOn: '2026-03-01',
      endsOn: '2026-03-31',
      demands: [{ dayId: '2026-03-10', requiredDoctors: 2 }],
    });

    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const next = vi.fn();
    const res = { status, json, locals: {} };

    await validateCreateSprintMiddleware(
      {
        body: {
          name: 'Guardias Marzo',
          periodId: period.id,
          globalConfig: { requiredDoctorsPerShift: 2, maxDaysPerDoctorDefault: 8 },
          doctorIds: [doctor.id],
        },
      } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();

    await createSprintController({} as never, res as never, next);
    expect(status).toHaveBeenCalledWith(201);

    const createdCall = json.mock.calls[0];
    if (!createdCall) {
      throw new Error('Expected sprint create response');
    }
    const created = createdCall[0] as { id: string; name: string };
    expect(created.id).toBeTruthy();
    expect(created.name).toBe('Guardias Marzo');

    const statusGet = vi.fn().mockReturnThis();
    const jsonGet = vi.fn();
    await getSprintController(
      { params: { sprintId: created.id } } as never,
      { status: statusGet, json: jsonGet } as never,
      next,
    );

    expect(statusGet).toHaveBeenCalledWith(200);
    expect(jsonGet).toHaveBeenCalledWith(expect.objectContaining({ id: created.id }));
  });

  it('updates sprint global config', async () => {
    const doctor = await createDoctor({ name: 'Dr. Uno', active: true, maxTotalDaysDefault: 8 });
    const period = await createPeriod({
      name: 'Abril 2026',
      startsOn: '2026-04-01',
      endsOn: '2026-04-30',
      demands: [{ dayId: '2026-04-10', requiredDoctors: 1 }],
    });

    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateCreateSprintMiddleware(
      {
        body: {
          name: 'Guardias Abril',
          periodId: period.id,
          globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 6 },
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

    const patchRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };
    await validateUpdateSprintGlobalConfigMiddleware(
      {
        body: {
          globalConfig: { requiredDoctorsPerShift: 3, maxDaysPerDoctorDefault: 7 },
        },
      } as never,
      patchRes as never,
      next,
    );

    await updateSprintGlobalConfigController(
      { params: { sprintId: created.id } } as never,
      patchRes as never,
      next,
    );

    expect(patchRes.status).toHaveBeenCalledWith(200);
    expect(patchRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: created.id,
        globalConfig: { requiredDoctorsPerShift: 3, maxDaysPerDoctorDefault: 7 },
      }),
    );
  });

  it('lists sprints', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();

    await listSprintsController({} as never, { status, json } as never, vi.fn());

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ items: [] });
  });

  it('rejects invalid create sprint payload', async () => {
    const next = vi.fn();
    await validateCreateSprintMiddleware(
      {
        body: {
          name: '',
          periodId: '',
          globalConfig: { requiredDoctorsPerShift: 0, maxDaysPerDoctorDefault: 8 },
        },
      } as never,
      { locals: {} } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('adds and removes sprint doctors while draft', async () => {
    const doctorA = await createDoctor({ name: 'Dr. A', active: true, maxTotalDaysDefault: 8 });
    const doctorB = await createDoctor({ name: 'Dr. B', active: true, maxTotalDaysDefault: 7 });
    const period = await createPeriod({
      name: 'Mayo 2026',
      startsOn: '2026-05-01',
      endsOn: '2026-05-31',
      demands: [{ dayId: '2026-05-03', requiredDoctors: 1 }],
    });

    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };
    await validateCreateSprintMiddleware(
      {
        body: {
          name: 'Guardias Mayo',
          periodId: period.id,
          globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 8 },
          doctorIds: [doctorA.id],
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

    const addRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };
    await validateAddSprintDoctorMiddleware({ body: { doctorId: doctorB.id } } as never, addRes as never, next);
    await addSprintDoctorController({ params: { sprintId: created.id } } as never, addRes as never, next);

    expect(addRes.status).toHaveBeenCalledWith(200);
    expect(addRes.json).toHaveBeenCalledWith(expect.objectContaining({ doctorIds: [doctorA.id, doctorB.id] }));

    const removeRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };
    await removeSprintDoctorController(
      { params: { sprintId: created.id, doctorId: doctorA.id } } as never,
      removeRes as never,
      next,
    );

    expect(removeRes.status).toHaveBeenCalledWith(200);
    expect(removeRes.json).toHaveBeenCalledWith(expect.objectContaining({ doctorIds: [doctorB.id] }));
  });

  it('rejects participant edits when sprint is ready-to-solve', async () => {
    const doctorA = await createDoctor({ name: 'Dr. A', active: true, maxTotalDaysDefault: 8 });
    const doctorB = await createDoctor({ name: 'Dr. B', active: true, maxTotalDaysDefault: 7 });
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
          doctorIds: [doctorA.id],
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

    await updateDoctorAvailability(
      created.id,
      doctorA.id,
      [{ periodId: period.id, dayId: '2026-06-01' }],
      { role: 'planner', userId: 'planner-1' },
    );
    const markReadyRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: { markReadyRequest: { status: 'ready-to-solve' } } };
    await markSprintReadyController({ params: { sprintId: created.id } } as never, markReadyRes as never, next);

    const addRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };
    await validateAddSprintDoctorMiddleware({ body: { doctorId: doctorB.id } } as never, addRes as never, next);
    await addSprintDoctorController({ params: { sprintId: created.id } } as never, addRes as never, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
  });
});
