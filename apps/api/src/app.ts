import express from 'express';
import type { Express } from 'express';
import type { RequestHandler } from 'express';

export const healthHandler: RequestHandler = (_req, res) => {
  res.status(200).json({ status: 'ok' });
};

export function createApp(): Express {
  const app = express();

  app.get('/health', healthHandler);

  return app;
}
