import { Router } from 'express';
import {
  listSprintRunsController,
  markSprintReadyController,
  runSprintSolveController,
} from '../../controllers/sprint/sprint-run.controller.js';
import { requireRoleMiddleware } from '../../middlewares/auth/actor.middleware.js';
import {
  validateMarkSprintReadyMiddleware,
  validateRunSprintSolveMiddleware,
} from '../../middlewares/sprint/validate-sprint-run.middleware.js';

export function createSprintRunRoutes(): Router {
  const router = Router();

  router.patch('/sprints/:sprintId/status', requireRoleMiddleware('planner'), validateMarkSprintReadyMiddleware, markSprintReadyController);
  router.post('/sprints/:sprintId/runs', requireRoleMiddleware('planner'), validateRunSprintSolveMiddleware, runSprintSolveController);
  router.get('/sprints/:sprintId/runs', requireRoleMiddleware('planner'), listSprintRunsController);

  return router;
}
