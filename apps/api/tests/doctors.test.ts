import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDoctorController,
  deleteDoctorController,
  getDoctorController,
  listDoctorsController,
  updateDoctorController,
} from '../src/controllers/doctor.controller.js';
import {
  validateCreateDoctorMiddleware,
  validateUpdateDoctorMiddleware,
} from '../src/middlewares/validate-doctor.middleware.js';
import { clearDoctorStore } from '../src/services/doctor/doctor.repository.js';

describe('doctor controllers', () => {
  beforeEach(async () => {
    await clearDoctorStore();
  });

  it('creates, reads, updates, lists, and deletes a doctor', async () => {
    const next = vi.fn();
    const createRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };

    await validateCreateDoctorMiddleware(
      {
        body: { name: 'Dr. Strange', active: true, maxTotalDaysDefault: 7 },
      } as never,
      createRes as never,
      next,
    );

    await createDoctorController({} as never, createRes as never, next);
    expect(createRes.status).toHaveBeenCalledWith(201);

    const createdCall = createRes.json.mock.calls[0]?.[0] as { id: string; name: string };
    expect(createdCall.name).toBe('Dr. Strange');

    const getRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await getDoctorController({ params: { doctorId: createdCall.id } } as never, getRes as never, next);
    expect(getRes.status).toHaveBeenCalledWith(200);

    const updateRes = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} };
    await validateUpdateDoctorMiddleware({ body: { active: false } } as never, updateRes as never, next);
    await updateDoctorController({ params: { doctorId: createdCall.id } } as never, updateRes as never, next);
    expect(updateRes.status).toHaveBeenCalledWith(200);
    expect(updateRes.json).toHaveBeenCalledWith(expect.objectContaining({ active: false }));

    const listRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await listDoctorsController({} as never, listRes as never, next);
    expect(listRes.status).toHaveBeenCalledWith(200);
    expect(listRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ id: createdCall.id })]),
      }),
    );

    const deleteRes = { status: vi.fn().mockReturnThis(), send: vi.fn() };
    await deleteDoctorController({ params: { doctorId: createdCall.id } } as never, deleteRes as never, next);
    expect(deleteRes.status).toHaveBeenCalledWith(204);
  });

  it('rejects invalid doctor payload', async () => {
    const next = vi.fn();
    await validateCreateDoctorMiddleware(
      {
        body: { name: '' },
      } as never,
      { locals: {} } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});
