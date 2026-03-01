import { Router } from 'express';
import { issueDevTokenController } from '../controllers/auth/auth-dev-token.controller.js';
import { validateIssueDevTokenMiddleware } from '../middlewares/auth/validate-dev-token.middleware.js';

export function createAuthRoutes(): Router {
  const router = Router();
  router.post('/auth/dev/token', validateIssueDevTokenMiddleware, issueDevTokenController);
  return router;
}
