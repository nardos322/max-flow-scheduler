import { Router } from 'express';
import { createHealthRoutes } from './health.routes.js';
import { createScheduleRoutes } from './schedule.routes.js';

export function createApiRoutes(): Router {
  const router = Router();
  router.use(createHealthRoutes());
  router.use(createScheduleRoutes());
  return router;
}
