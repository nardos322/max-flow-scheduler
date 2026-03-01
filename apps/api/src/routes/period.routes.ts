import { Router } from 'express';
import {
  createPeriodController,
  deletePeriodController,
  getPeriodController,
  listPeriodsController,
  replacePeriodDemandsController,
  updatePeriodController,
} from '../controllers/period.controller.js';
import { requireRoleMiddleware } from '../middlewares/auth/actor.middleware.js';
import {
  validateCreatePeriodMiddleware,
  validateReplacePeriodDemandsMiddleware,
  validateUpdatePeriodMiddleware,
} from '../middlewares/validate-period.middleware.js';

export function createPeriodRoutes(): Router {
  const router = Router();

  router.get('/periods', requireRoleMiddleware('planner'), listPeriodsController);
  router.post('/periods', requireRoleMiddleware('planner'), validateCreatePeriodMiddleware, createPeriodController);
  router.get('/periods/:periodId', requireRoleMiddleware('planner'), getPeriodController);
  router.patch('/periods/:periodId', requireRoleMiddleware('planner'), validateUpdatePeriodMiddleware, updatePeriodController);
  router.put(
    '/periods/:periodId/demands',
    requireRoleMiddleware('planner'),
    validateReplacePeriodDemandsMiddleware,
    replacePeriodDemandsController,
  );
  router.delete('/periods/:periodId', requireRoleMiddleware('planner'), deletePeriodController);

  return router;
}
