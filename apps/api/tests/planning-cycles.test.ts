import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDoctor, clearDoctorStore } from '../src/services/doctor/doctor.repository.js';
import { clearPeriodStore, createPeriod } from '../src/services/period/period.repository.js';
import { clearSprintStore } from '../src/services/sprint/sprint.repository.js';
import { clearSprintRunStore } from '../src/services/sprint/sprint-run.repository.js';
import { createSprint, updateDoctorAvailability } from '../src/services/sprint/sprint.service.js';
import { markSprintReadyToSolve } from '../src/services/sprint/sprint-ready.service.js';
import {
  createPlanningCycleController,
  getPlanningCycleController,
  listPlanningCycleRunsController,
  listPlanningCyclesController,
  runPlanningCycleController,
} from '../src/controllers/planning-cycle/planning-cycle.controller.js';
import {
  addSprintToPlanningCycle,
  createPlanningCycle,
  runPlanningCycle,
} from '../src/services/planning-cycle/planning-cycle.service.js';
import { clearPlanningCycleStore } from '../src/services/planning-cycle/planning-cycle.repository.js';
import {
  validateAddPlanningCycleSprintMiddleware,
  validateCreatePlanningCycleMiddleware,
  validateRunPlanningCycleMiddleware,
} from '../src/middlewares/planning-cycle/validate-planning-cycle.middleware.js';
import { addPlanningCycleSprintController } from '../src/controllers/planning-cycle/planning-cycle.controller.js';

describe('planning cycle controllers and services', () => {
  beforeEach(async () => {
    await clearPlanningCycleStore();
    await clearSprintRunStore();
    await clearSprintStore();
    await clearDoctorStore();
    await clearPeriodStore();
  });

  it('creates, lists and gets planning cycles via controllers', async () => {
    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateCreatePlanningCycleMiddleware({ body: { name: 'Q2 Cycle' } } as never, createRes as never, next);
    await createPlanningCycleController({} as never, createRes as never, next);

    expect(createRes.status).toHaveBeenCalledWith(201);
    const createdCall = createRes.json.mock.calls[0];
    if (!createdCall) {
      throw new Error('Expected planning cycle create response');
    }
    const created = createdCall[0] as { id: string };

    const listRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await listPlanningCyclesController({ query: {} } as never, listRes as never, next);
    expect(listRes.status).toHaveBeenCalledWith(200);
    expect(listRes.json).toHaveBeenCalledWith(expect.objectContaining({ items: expect.any(Array) }));

    const getRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await getPlanningCycleController({ params: { cycleId: created.id } } as never, getRes as never, next);
    expect(getRes.status).toHaveBeenCalledWith(200);
    expect(getRes.json).toHaveBeenCalledWith(expect.objectContaining({ id: created.id }));
  });

  it('adds sprint to planning cycle via controller', async () => {
    const doctor = await createDoctor({ name: 'Dr. Uno', active: true, maxTotalDaysDefault: 8 });
    const period = await createPeriod({
      name: 'Marzo 2026',
      startsOn: '2026-03-01',
      endsOn: '2026-03-31',
      demands: [{ dayId: '2026-03-10', requiredDoctors: 1 }],
    });
    const sprint = await createSprint({
      name: 'Sprint Marzo',
      periodId: period.id,
      globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 8 },
      doctorIds: [doctor.id],
    });
    const cycle = await createPlanningCycle({ name: 'Q2 Cycle' });

    const next = vi.fn();
    const addRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateAddPlanningCycleSprintMiddleware(
      { body: { sprintId: sprint.id, orderIndex: 1 } } as never,
      addRes as never,
      next,
    );
    await addPlanningCycleSprintController({ params: { cycleId: cycle.id } } as never, addRes as never, next);

    expect(addRes.status).toHaveBeenCalledWith(200);
    expect(addRes.json).toHaveBeenCalledWith(expect.objectContaining({ sprintIds: [sprint.id] }));
  });

  it('runs planning cycle with mixed outcomes using mocked solver', async () => {
    const doctor = await createDoctor({ name: 'Dr. Uno', active: true, maxTotalDaysDefault: 8 });
    const period = await createPeriod({
      name: 'Abril 2026',
      startsOn: '2026-04-01',
      endsOn: '2026-04-30',
      demands: [{ dayId: '2026-04-01', requiredDoctors: 1 }],
    });

    const readySprint = await createSprint({
      name: 'Ready Sprint',
      periodId: period.id,
      globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 8 },
      doctorIds: [doctor.id],
    });
    await updateDoctorAvailability(
      readySprint.id,
      doctor.id,
      [{ periodId: period.id, dayId: '2026-04-01' }],
      { role: 'planner', userId: 'planner-1' },
    );
    await markSprintReadyToSolve(readySprint.id);

    const draftSprint = await createSprint({
      name: 'Draft Sprint',
      periodId: period.id,
      globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 8 },
      doctorIds: [doctor.id],
    });

    const cycle = await createPlanningCycle({ name: 'Q2 Mixed' });
    await addSprintToPlanningCycle(cycle.id, readySprint.id);
    await addSprintToPlanningCycle(cycle.id, draftSprint.id);

    const result = await runPlanningCycle(cycle.id, async () => ({
      contractVersion: '1.0',
      isFeasible: true,
      assignedCount: 1,
      uncoveredDays: [],
      assignments: [{ doctorId: doctor.id, periodId: period.id, dayId: '2026-04-01' }],
    }));

    expect('run' in result).toBe(true);
    if (!('run' in result)) {
      return;
    }
    expect(result.run.status).toBe('partial-failed');
    expect(result.run.items.length).toBe(2);
    expect(result.run.items.some((item) => item.status === 'failed')).toBe(true);
  }, 20_000);

  it('returns 422 from controller when running empty planning cycle', async () => {
    const cycle = await createPlanningCycle({ name: 'Empty' });
    const next = vi.fn();
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateRunPlanningCycleMiddleware({ body: {} } as never, res as never, next);
    await runPlanningCycleController({ params: { cycleId: cycle.id } } as never, res as never, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
  });

  it('lists planning cycle runs with pagination cursor params', async () => {
    const cycle = await createPlanningCycle({ name: 'Cycle Runs' });
    const next = vi.fn();
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await listPlanningCycleRunsController(
      {
        params: { cycleId: cycle.id },
        query: { limit: '10' },
      } as never,
      res as never,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ items: expect.any(Array) }));
  });
});
