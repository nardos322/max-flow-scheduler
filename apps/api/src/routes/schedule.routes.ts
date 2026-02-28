import { Router } from 'express';
import { solveScheduleController } from '../controllers/schedule.controller.js';
import { validateSolveRequestMiddleware } from '../middlewares/validate-solve-request.middleware.js';

export function createScheduleRoutes(): Router {
  const router = Router();
  router.post('/schedule/solve', validateSolveRequestMiddleware, solveScheduleController);
  return router;
}
