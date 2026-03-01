import { Router } from 'express';
import {
  listSprintAvailabilityController,
  plannerOverrideAvailabilityController,
  setDoctorAvailabilityController,
} from '../../controllers/sprint/sprint-availability.controller.js';
import { requireRoleMiddleware } from '../../middlewares/auth/actor.middleware.js';
import {
  validatePlannerOverrideAvailabilityMiddleware,
  validateSetDoctorAvailabilityMiddleware,
} from '../../middlewares/sprint/validate-sprint-availability.middleware.js';

export function createSprintAvailabilityRoutes(): Router {
  const router = Router();

  router.get('/sprints/:sprintId/availability', requireRoleMiddleware('doctor', 'planner'), listSprintAvailabilityController);
  router.put(
    '/sprints/:sprintId/doctors/:doctorId/availability',
    requireRoleMiddleware('doctor'),
    validateSetDoctorAvailabilityMiddleware,
    setDoctorAvailabilityController,
  );
  router.put(
    '/sprints/:sprintId/availability/override',
    requireRoleMiddleware('planner'),
    validatePlannerOverrideAvailabilityMiddleware,
    plannerOverrideAvailabilityController,
  );

  return router;
}
