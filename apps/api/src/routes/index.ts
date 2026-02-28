import { Router } from 'express';
import { createHealthRoutes } from './health.routes.js';
import { createScheduleRoutes } from './schedule.routes.js';
import { createSprintAvailabilityRoutes } from './sprint/sprint-availability.routes.js';
import { createSprintRoutes } from './sprint/sprint.routes.js';
import { createSprintRunRoutes } from './sprint/sprint-run.routes.js';

export function createApiRoutes(): Router {
  const router = Router();
  router.use(createHealthRoutes());
  router.use(createScheduleRoutes());
  router.use(createSprintRoutes());
  router.use(createSprintAvailabilityRoutes());
  router.use(createSprintRunRoutes());
  return router;
}
