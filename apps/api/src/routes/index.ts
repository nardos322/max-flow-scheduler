import { Router } from 'express';
import { createHealthRoutes } from './health.routes.js';
import { createScheduleRoutes } from './schedule.routes.js';
import { createSprintRoutes } from './sprint/sprint.routes.js';

export function createApiRoutes(): Router {
  const router = Router();
  router.use(createHealthRoutes());
  router.use(createScheduleRoutes());
  router.use(createSprintRoutes());
  return router;
}
