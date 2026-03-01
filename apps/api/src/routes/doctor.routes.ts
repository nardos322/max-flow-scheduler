import { Router } from 'express';
import {
  createDoctorController,
  deleteDoctorController,
  getDoctorController,
  listDoctorsController,
  updateDoctorController,
} from '../controllers/doctor.controller.js';
import { requireRoleMiddleware } from '../middlewares/auth/actor.middleware.js';
import {
  validateCreateDoctorMiddleware,
  validateUpdateDoctorMiddleware,
} from '../middlewares/validate-doctor.middleware.js';

export function createDoctorRoutes(): Router {
  const router = Router();

  router.get('/doctors', requireRoleMiddleware('planner'), listDoctorsController);
  router.post('/doctors', requireRoleMiddleware('planner'), validateCreateDoctorMiddleware, createDoctorController);
  router.get('/doctors/:doctorId', requireRoleMiddleware('planner'), getDoctorController);
  router.patch(
    '/doctors/:doctorId',
    requireRoleMiddleware('planner'),
    validateUpdateDoctorMiddleware,
    updateDoctorController,
  );
  router.delete('/doctors/:doctorId', requireRoleMiddleware('planner'), deleteDoctorController);

  return router;
}
