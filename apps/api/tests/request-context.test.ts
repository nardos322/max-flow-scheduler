import { describe, expect, it, vi } from 'vitest';
import { requestContextMiddleware } from '../src/middlewares/request-context.middleware.js';

describe('requestContextMiddleware', () => {
  it('uses x-request-id header when provided', async () => {
    const setHeader = vi.fn();
    const next = vi.fn();
    const res = { locals: {}, setHeader };

    await requestContextMiddleware(
      { headers: { 'x-request-id': 'abc-123' } } as never,
      res as never,
      next,
    );

    expect(res.locals).toEqual({ requestId: 'abc-123' });
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'abc-123');
    expect(next).toHaveBeenCalled();
  });

  it('generates x-request-id when header is missing', async () => {
    const setHeader = vi.fn();
    const next = vi.fn();
    const res = { locals: {}, setHeader };

    await requestContextMiddleware(
      { headers: {} } as never,
      res as never,
      next,
    );

    expect(typeof (res.locals as { requestId: string }).requestId).toBe('string');
    expect((res.locals as { requestId: string }).requestId.length).toBeGreaterThan(0);
    expect(setHeader).toHaveBeenCalledWith('x-request-id', (res.locals as { requestId: string }).requestId);
    expect(next).toHaveBeenCalled();
  });
});
