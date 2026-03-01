import express from 'express';
import type { Express } from 'express';
import { errorHandlerMiddleware, notFoundMiddleware } from './middlewares/error-handler.middleware.js';
import { requestContextMiddleware } from './middlewares/request-context.middleware.js';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware.js';
import { rateLimitMiddleware, resolveBodyLimit, securityHeadersMiddleware } from './middlewares/security.middleware.js';
import { createApiRoutes } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  app.use(requestContextMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(rateLimitMiddleware);
  app.use(express.json({ limit: resolveBodyLimit() }));
  app.use(requestLoggerMiddleware);
  app.use(createApiRoutes());
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
