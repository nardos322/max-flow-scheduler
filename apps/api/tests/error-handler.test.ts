import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../src/errors/http.error.js';
import { SolverError } from '../src/errors/solver.error.js';
import { errorHandlerMiddleware, notFoundMiddleware } from '../src/middlewares/error-handler.middleware.js';

describe('notFoundMiddleware', () => {
  it('returns 404 with requestId', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json, locals: { requestId: 'req-1' } };

    await notFoundMiddleware({} as never, res as never, vi.fn());

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'Route not found', requestId: 'req-1' });
  });
});

describe('errorHandlerMiddleware', () => {
  it('maps HttpError to response body with requestId', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json, locals: { requestId: 'req-2' } };

    await errorHandlerMiddleware(
      new HttpError(400, { error: 'Invalid schedule payload' }),
      { method: 'POST', path: '/schedule/solve' } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'Invalid schedule payload', requestId: 'req-2' });
  });

  it('maps SolverError(422) including code and details', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json, locals: { requestId: 'req-3' } };

    await errorHandlerMiddleware(
      new SolverError(422, 'SOLVER_UNPROCESSABLE', 'Solver rejected payload', 'json parse error'),
      { method: 'POST', path: '/schedule/solve' } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith({
      error: 'Solver rejected payload',
      code: 'SOLVER_UNPROCESSABLE',
      details: 'json parse error',
      requestId: 'req-3',
    });
  });

  it('maps unknown errors to 500', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json, locals: { requestId: 'req-4' } };

    await errorHandlerMiddleware(
      new Error('boom'),
      { method: 'POST', path: '/schedule/solve' } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: 'Unexpected solver failure', requestId: 'req-4' });
  });

  it('maps payload-too-large parser errors to 413', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json, locals: { requestId: 'req-5' } };

    await errorHandlerMiddleware(
      { status: 413, type: 'entity.too.large' },
      { method: 'POST', path: '/schedule/solve' } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(413);
    expect(json).toHaveBeenCalledWith({
      error: 'Request body too large',
      code: 'PAYLOAD_TOO_LARGE',
      requestId: 'req-5',
    });
  });

  it('maps malformed-json parser errors to 400', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json, locals: { requestId: 'req-6' } };

    await errorHandlerMiddleware(
      { status: 400, type: 'entity.parse.failed' },
      { method: 'POST', path: '/schedule/solve' } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: 'Malformed JSON body',
      code: 'INVALID_JSON',
      requestId: 'req-6',
    });
  });

  it('sanitizes solver details for 500 responses', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json, locals: { requestId: 'req-7' } };

    await errorHandlerMiddleware(
      new SolverError(500, 'EXIT_NON_ZERO', 'Solver execution failed', 'sensitive details'),
      { method: 'POST', path: '/schedule/solve' } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: 'Solver execution failed',
      code: 'EXIT_NON_ZERO',
      details: undefined,
      requestId: 'req-7',
    });
  });
});
