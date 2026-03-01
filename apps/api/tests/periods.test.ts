import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPeriodController,
  deletePeriodController,
  getPeriodController,
  listPeriodsController,
  replacePeriodDemandsController,
  updatePeriodController,
} from '../src/controllers/period.controller.js';
import {
  validateCreatePeriodMiddleware,
  validateReplacePeriodDemandsMiddleware,
  validateUpdatePeriodMiddleware,
} from '../src/middlewares/validate-period.middleware.js';
import { clearPeriodStore } from '../src/services/period/period.repository.js';

describe('period controllers', () => {
  beforeEach(async () => {
    await clearPeriodStore();
  });

  it('creates, updates, replaces demands, lists, and deletes a period', async () => {
    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateCreatePeriodMiddleware(
      {
        body: {
          name: 'Agosto 2026',
          startsOn: '2026-08-01',
          endsOn: '2026-08-31',
          demands: [{ dayId: '2026-08-01', requiredDoctors: 2 }],
        },
      } as never,
      createRes as never,
      next,
    );

    await createPeriodController({} as never, createRes as never, next);
    expect(createRes.status).toHaveBeenCalledWith(201);

    const createdCall = createRes.json.mock.calls[0]?.[0] as { id: string };

    const updateRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };
    await validateUpdatePeriodMiddleware({ body: { name: 'Agosto 2026 v2' } } as never, updateRes as never, next);
    await updatePeriodController({ params: { periodId: createdCall.id } } as never, updateRes as never, next);
    expect(updateRes.status).toHaveBeenCalledWith(200);

    const replaceRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };
    await validateReplacePeriodDemandsMiddleware(
      {
        body: {
          demands: [{ dayId: '2026-08-02', requiredDoctors: 3 }],
        },
      } as never,
      replaceRes as never,
      next,
    );
    await replacePeriodDemandsController({ params: { periodId: createdCall.id } } as never, replaceRes as never, next);
    expect(replaceRes.status).toHaveBeenCalledWith(200);
    expect(replaceRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        demands: [{ dayId: '2026-08-02', requiredDoctors: 3 }],
      }),
    );

    const getRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await getPeriodController({ params: { periodId: createdCall.id } } as never, getRes as never, next);
    expect(getRes.status).toHaveBeenCalledWith(200);

    const listRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await listPeriodsController({} as never, listRes as never, next);
    expect(listRes.status).toHaveBeenCalledWith(200);

    const deleteRes = { status: vi.fn().mockReturnThis(), send: vi.fn() };
    await deletePeriodController({ params: { periodId: createdCall.id } } as never, deleteRes as never, next);
    expect(deleteRes.status).toHaveBeenCalledWith(204);
  });

  it('rejects demand outside period range', async () => {
    const next = vi.fn();
    await validateCreatePeriodMiddleware(
      {
        body: {
          name: 'Agosto 2026',
          startsOn: '2026-08-01',
          endsOn: '2026-08-31',
          demands: [{ dayId: '2026-09-01', requiredDoctors: 2 }],
        },
      } as never,
      { locals: {} } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});
