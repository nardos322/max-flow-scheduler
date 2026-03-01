import { Router } from 'express';
import {
  addSprintDoctorController,
  createSprintController,
  getSprintController,
  listSprintsController,
  removeSprintDoctorController,
  updateSprintGlobalConfigController,
} from '../../controllers/sprint/sprint.controller.js';
import { requireRoleMiddleware } from '../../middlewares/auth/actor.middleware.js';
import {
  validateAddSprintDoctorMiddleware,
  validateCreateSprintMiddleware,
  validateUpdateSprintGlobalConfigMiddleware,
} from '../../middlewares/sprint/validate-sprint.middleware.js';

export function createSprintRoutes(): Router {
  const router = Router();

  router.get('/sprints', requireRoleMiddleware('planner'), listSprintsController);
  router.post('/sprints', requireRoleMiddleware('planner'), validateCreateSprintMiddleware, createSprintController);
  router.get('/sprints/:sprintId', requireRoleMiddleware('planner'), getSprintController);
  router.patch(
    '/sprints/:sprintId/global-config',
    requireRoleMiddleware('planner'),
    validateUpdateSprintGlobalConfigMiddleware,
    updateSprintGlobalConfigController,
  );
  router.post(
    '/sprints/:sprintId/doctors',
    requireRoleMiddleware('planner'),
    validateAddSprintDoctorMiddleware,
    addSprintDoctorController,
  );
  router.delete('/sprints/:sprintId/doctors/:doctorId', requireRoleMiddleware('planner'), removeSprintDoctorController);

  return router;
}
