import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  listSprintAvailabilityController,
  plannerOverrideAvailabilityController,
  setDoctorAvailabilityController,
} from '../src/controllers/sprint/sprint-availability.controller.js';
import { createSprintController } from '../src/controllers/sprint/sprint.controller.js';
import { requireRoleMiddleware, resolveActorMiddleware } from '../src/middlewares/auth/actor.middleware.js';
import {
  validatePlannerOverrideAvailabilityMiddleware,
  validateSetDoctorAvailabilityMiddleware,
} from '../src/middlewares/sprint/validate-sprint-availability.middleware.js';
import { validateCreateSprintMiddleware } from '../src/middlewares/sprint/validate-sprint.middleware.js';
import { clearDoctorStore, createDoctor } from '../src/services/doctor/doctor.repository.js';
import { clearPeriodStore, createPeriod } from '../src/services/period/period.repository.js';
import { clearSprintStore } from '../src/services/sprint/sprint.repository.js';

function signTestJwt(claims: Record<string, unknown>, secret: string): string {
  return jwt.sign(claims, secret, { algorithm: 'HS256' });
}

async function createBaseSprint(): Promise<{ id: string; doctorAId: string; doctorBId: string; periodId: string }> {
  const doctorA = await createDoctor({ name: 'Dr. Uno', active: true, maxTotalDaysDefault: 8 });
  const doctorB = await createDoctor({ name: 'Dr. Dos', active: true, maxTotalDaysDefault: 8 });
  const period = await createPeriod({
    name: 'Julio 2026',
    startsOn: '2026-07-01',
    endsOn: '2026-07-31',
    demands: [{ dayId: '2026-07-01', requiredDoctors: 1 }],
  });

  const next = vi.fn();
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

  await validateCreateSprintMiddleware(
    {
      body: {
        name: 'Guardias Julio',
        periodId: period.id,
        globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 8 },
        doctorIds: [doctorA.id, doctorB.id],
      },
    } as never,
    res as never,
    next,
  );

  await createSprintController({} as never, res as never, next);

  const createdCall = res.json.mock.calls[0];
  if (!createdCall) {
    throw new Error('Expected sprint create response');
  }

  const created = createdCall[0] as { id: string };
  return { id: created.id, doctorAId: doctorA.id, doctorBId: doctorB.id, periodId: period.id };
}

describe('sprint availability controllers', () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ISSUER = 'scheduler-api-tests';
    process.env.JWT_AUDIENCE = 'scheduler-api';
    await clearSprintStore();
    await clearDoctorStore();
    await clearPeriodStore();
  });

  it('allows doctor self-service availability updates', async () => {
    const created = await createBaseSprint();

    const req = {
      headers: {
        authorization: `Bearer ${signTestJwt(
          {
            sub: created.doctorAId,
            role: 'doctor',
            iss: 'scheduler-api-tests',
            aud: 'scheduler-api',
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
          'test-secret',
        )}`,
      },
      body: {
        availability: [
          { periodId: created.periodId, dayId: '2026-07-01' },
          { periodId: created.periodId, dayId: '2026-07-02' },
        ],
      },
      params: { sprintId: created.id, doctorId: created.doctorAId },
    };

    const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    const nextResolve = vi.fn();
    await resolveActorMiddleware(req as never, res as never, nextResolve);
    expect(nextResolve).toHaveBeenCalledWith();

    const nextRole = vi.fn();
    await requireRoleMiddleware('doctor')(req as never, res as never, nextRole);
    expect(nextRole).toHaveBeenCalledWith();

    const nextValidate = vi.fn();
    await validateSetDoctorAvailabilityMiddleware(req as never, res as never, nextValidate);
    expect(nextValidate).toHaveBeenCalledWith();

    const nextController = vi.fn();
    await setDoctorAvailabilityController(req as never, res as never, nextController);

    expect(nextController).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: created.id,
        availability: expect.arrayContaining([
          expect.objectContaining({
            doctorId: created.doctorAId,
            source: 'doctor-self-service',
            updatedByRole: 'doctor',
            updatedByUserId: created.doctorAId,
          }),
        ]),
      }),
    );
  });

  it('rejects doctor writing availability for another doctor', async () => {
    const created = await createBaseSprint();

    const req = {
      headers: {
        authorization: `Bearer ${signTestJwt(
          {
            sub: created.doctorAId,
            role: 'doctor',
            iss: 'scheduler-api-tests',
            aud: 'scheduler-api',
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
          'test-secret',
        )}`,
      },
      body: {
        availability: [{ periodId: created.periodId, dayId: '2026-07-01' }],
      },
      params: { sprintId: created.id, doctorId: created.doctorBId },
    };

    const res = { locals: {} };

    await resolveActorMiddleware(req as never, res as never, vi.fn());
    await requireRoleMiddleware('doctor')(req as never, res as never, vi.fn());
    await validateSetDoctorAvailabilityMiddleware(req as never, res as never, vi.fn());

    const nextController = vi.fn();
    await setDoctorAvailabilityController(req as never, res as never, nextController);

    expect(nextController).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('allows planner override and keeps traceability', async () => {
    const created = await createBaseSprint();

    const req = {
      headers: {
        authorization: `Bearer ${signTestJwt(
          {
            sub: 'planner-1',
            role: 'planner',
            iss: 'scheduler-api-tests',
            aud: 'scheduler-api',
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
          'test-secret',
        )}`,
      },
      body: {
        doctorId: created.doctorBId,
        availability: [{ periodId: created.periodId, dayId: '2026-07-08' }],
      },
      params: { sprintId: created.id },
    };

    const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await resolveActorMiddleware(req as never, res as never, vi.fn());
    await requireRoleMiddleware('planner')(req as never, res as never, vi.fn());
    await validatePlannerOverrideAvailabilityMiddleware(req as never, res as never, vi.fn());

    const nextController = vi.fn();
    await plannerOverrideAvailabilityController(req as never, res as never, nextController);

    expect(nextController).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        availability: expect.arrayContaining([
          expect.objectContaining({
            doctorId: created.doctorBId,
            source: 'planner-override',
            updatedByRole: 'planner',
            updatedByUserId: 'planner-1',
          }),
        ]),
      }),
    );
  });

  it('rejects override endpoint for doctor role', async () => {
    const created = await createBaseSprint();

    const req = {
      headers: {
        authorization: `Bearer ${signTestJwt(
          {
            sub: created.doctorAId,
            role: 'doctor',
            iss: 'scheduler-api-tests',
            aud: 'scheduler-api',
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
          'test-secret',
        )}`,
      },
    };

    const res = { locals: {} };

    await resolveActorMiddleware(req as never, res as never, vi.fn());

    const nextRole = vi.fn();
    await requireRoleMiddleware('planner')(req as never, res as never, nextRole);

    expect(nextRole).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('lists sprint availability entries', async () => {
    const created = await createBaseSprint();

    const updateReq = {
      headers: {
        authorization: `Bearer ${signTestJwt(
          {
            sub: created.doctorAId,
            role: 'doctor',
            iss: 'scheduler-api-tests',
            aud: 'scheduler-api',
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
          'test-secret',
        )}`,
      },
      body: {
        availability: [{ periodId: created.periodId, dayId: '2026-07-01' }],
      },
      params: { sprintId: created.id, doctorId: created.doctorAId },
    };

    const updateRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };
    await resolveActorMiddleware(updateReq as never, updateRes as never, vi.fn());
    await requireRoleMiddleware('doctor')(updateReq as never, updateRes as never, vi.fn());
    await validateSetDoctorAvailabilityMiddleware(updateReq as never, updateRes as never, vi.fn());
    await setDoctorAvailabilityController(updateReq as never, updateRes as never, vi.fn());

    const listRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await listSprintAvailabilityController(
      { params: { sprintId: created.id } } as never,
      listRes as never,
      vi.fn(),
    );

    expect(listRes.status).toHaveBeenCalledWith(200);
    expect(listRes.json).toHaveBeenCalledWith({
      items: expect.arrayContaining([
        expect.objectContaining({ doctorId: created.doctorAId, periodId: created.periodId, dayId: '2026-07-01' }),
      ]),
    });
  });
});
