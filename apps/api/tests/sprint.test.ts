import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSprintController,
  getSprintController,
  listSprintsController,
  updateSprintGlobalConfigController,
} from '../src/controllers/sprint/sprint.controller.js';
import {
  validateCreateSprintMiddleware,
  validateUpdateSprintGlobalConfigMiddleware,
} from '../src/middlewares/sprint/validate-sprint.middleware.js';
import { clearSprintStore } from '../src/services/sprint/sprint.repository.js';

describe('sprint controllers', () => {
  beforeEach(() => {
    clearSprintStore();
  });

  it('creates and fetches a sprint', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const next = vi.fn();
    const res = { status, json, locals: {} };

    await validateCreateSprintMiddleware(
      {
        body: {
          name: 'Guardias Marzo',
          startsOn: '2026-03-01',
          endsOn: '2026-03-31',
          globalConfig: { requiredDoctorsPerShift: 2, maxDaysPerDoctorDefault: 8 },
          doctors: [{ id: 'd1' }],
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
    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateCreateSprintMiddleware(
      {
        body: {
          name: 'Guardias Abril',
          startsOn: '2026-04-01',
          endsOn: '2026-04-30',
          globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 6 },
          doctors: [],
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
          startsOn: '2026-03-01',
          endsOn: '2026-03-31',
          globalConfig: { requiredDoctorsPerShift: 0, maxDaysPerDoctorDefault: 8 },
        },
      } as never,
      { locals: {} } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});
