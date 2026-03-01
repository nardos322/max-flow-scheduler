import { Router } from 'express';
import { resolveActorMiddleware } from '../middlewares/auth/actor.middleware.js';
import { createAuthRoutes } from './auth.routes.js';
import { createDoctorRoutes } from './doctor.routes.js';
import { createDocsRoutes } from './docs.routes.js';
import { createHealthRoutes } from './health.routes.js';
import { createPlanningCycleRoutes } from './planning-cycle.routes.js';
import { createPeriodRoutes } from './period.routes.js';
import { createScheduleRoutes } from './schedule.routes.js';
import { createSprintAvailabilityRoutes } from './sprint/sprint-availability.routes.js';
import { createSprintRoutes } from './sprint/sprint.routes.js';
import { createSprintRunRoutes } from './sprint/sprint-run.routes.js';

export function createApiRoutes(): Router {
  const router = Router();
  router.use(createHealthRoutes());
  router.use(createDocsRoutes());
  router.use(createAuthRoutes());
  router.use(resolveActorMiddleware);
  router.use(createDoctorRoutes());
  router.use(createPeriodRoutes());
  router.use(createScheduleRoutes());
  router.use(createPlanningCycleRoutes());
  router.use(createSprintRoutes());
  router.use(createSprintAvailabilityRoutes());
  router.use(createSprintRunRoutes());
  return router;
}
