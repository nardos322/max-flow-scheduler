import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../errors/http.error.js';
import { EngineRunnerError } from '../services/engine-runner.service.js';

export const notFoundMiddleware: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
};

export const errorHandlerMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json(error.body);
    return;
  }

  if (error instanceof EngineRunnerError) {
    res.status(500).json({
      error: 'Solver execution failed',
      details: error.code,
    });
    return;
  }

  res.status(500).json({ error: 'Unexpected solver failure' });
};
