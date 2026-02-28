import { Router } from 'express';
import {
  createSprintController,
  getSprintController,
  listSprintsController,
  updateSprintGlobalConfigController,
} from '../../controllers/sprint/sprint.controller.js';
import {
  validateCreateSprintMiddleware,
  validateUpdateSprintGlobalConfigMiddleware,
} from '../../middlewares/sprint/validate-sprint.middleware.js';

export function createSprintRoutes(): Router {
  const router = Router();

  router.get('/sprints', listSprintsController);
  router.post('/sprints', validateCreateSprintMiddleware, createSprintController);
  router.get('/sprints/:sprintId', getSprintController);
  router.patch(
    '/sprints/:sprintId/global-config',
    validateUpdateSprintGlobalConfigMiddleware,
    updateSprintGlobalConfigController,
  );

  return router;
}
