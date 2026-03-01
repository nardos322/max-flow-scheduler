import { Router } from 'express';
import {
  addPlanningCycleSprintController,
  createPlanningCycleController,
  getPlanningCycleController,
  listPlanningCycleRunsController,
  listPlanningCyclesController,
  runPlanningCycleController,
} from '../controllers/planning-cycle/planning-cycle.controller.js';
import { requireRoleMiddleware } from '../middlewares/auth/actor.middleware.js';
import {
  validateAddPlanningCycleSprintMiddleware,
  validateCreatePlanningCycleMiddleware,
  validateRunPlanningCycleMiddleware,
} from '../middlewares/planning-cycle/validate-planning-cycle.middleware.js';

export function createPlanningCycleRoutes(): Router {
  const router = Router();

  router.get('/planning-cycles', requireRoleMiddleware('planner'), listPlanningCyclesController);
  router.post(
    '/planning-cycles',
    requireRoleMiddleware('planner'),
    validateCreatePlanningCycleMiddleware,
    createPlanningCycleController,
  );
  router.get('/planning-cycles/:cycleId', requireRoleMiddleware('planner'), getPlanningCycleController);
  router.post(
    '/planning-cycles/:cycleId/sprints',
    requireRoleMiddleware('planner'),
    validateAddPlanningCycleSprintMiddleware,
    addPlanningCycleSprintController,
  );
  router.post(
    '/planning-cycles/:cycleId/runs',
    requireRoleMiddleware('planner'),
    validateRunPlanningCycleMiddleware,
    runPlanningCycleController,
  );
  router.get('/planning-cycles/:cycleId/runs', requireRoleMiddleware('planner'), listPlanningCycleRunsController);

  return router;
}
