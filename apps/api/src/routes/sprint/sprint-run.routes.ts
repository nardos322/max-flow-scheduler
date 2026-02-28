import { Router } from 'express';
import {
  listSprintRunsController,
  markSprintReadyController,
  runSprintSolveController,
} from '../../controllers/sprint/sprint-run.controller.js';
import {
  validateMarkSprintReadyMiddleware,
  validateRunSprintSolveMiddleware,
} from '../../middlewares/sprint/validate-sprint-run.middleware.js';

export function createSprintRunRoutes(): Router {
  const router = Router();

  router.patch('/sprints/:sprintId/status', validateMarkSprintReadyMiddleware, markSprintReadyController);
  router.post('/sprints/:sprintId/runs', validateRunSprintSolveMiddleware, runSprintSolveController);
  router.get('/sprints/:sprintId/runs', listSprintRunsController);

  return router;
}
