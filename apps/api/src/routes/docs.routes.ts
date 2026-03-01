import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from '../docs/openapi.js';

export function createDocsRoutes(): Router {
  const router = Router();
  router.get('/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
  });
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  return router;
}
