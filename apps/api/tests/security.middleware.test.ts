import { describe, expect, it, vi } from 'vitest';
import { createRateLimitMiddleware, securityHeadersMiddleware } from '../src/middlewares/security.middleware.js';

describe('securityHeadersMiddleware', () => {
  it('sets hardening headers', async () => {
    const setHeader = vi.fn();
    const next = vi.fn();

    await securityHeadersMiddleware({} as never, { setHeader } as never, next);

    expect(setHeader).toHaveBeenCalledWith('x-content-type-options', 'nosniff');
    expect(setHeader).toHaveBeenCalledWith('x-frame-options', 'DENY');
    expect(setHeader).toHaveBeenCalledWith('referrer-policy', 'no-referrer');
    expect(setHeader).toHaveBeenCalledWith('content-security-policy', expect.stringContaining("default-src 'none'"));
    expect(next).toHaveBeenCalledWith();
  });
});

describe('rateLimitMiddleware', () => {
  it('returns 429 after request threshold in same window', async () => {
    let now = 1_000;
    const middleware = createRateLimitMiddleware({ maxRequests: 2, now: () => now, windowMs: 10_000 });
    const next = vi.fn();
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const setHeader = vi.fn();
    const req = { ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' } };
    const res = { locals: { requestId: 'req-limit' }, status, json, setHeader };

    await middleware(req as never, res as never, next);
    await middleware(req as never, res as never, next);
    await middleware(req as never, res as never, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      error: 'Too many requests',
      code: 'RATE_LIMITED',
      requestId: 'req-limit',
    });
    expect(setHeader).toHaveBeenCalledWith('retry-after', expect.any(String));
  });

  it('resets counters after window elapses', async () => {
    let now = 2_000;
    const middleware = createRateLimitMiddleware({ maxRequests: 1, now: () => now, windowMs: 1_000 });
    const next = vi.fn();
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const req = { ip: '10.0.0.1', socket: { remoteAddress: '10.0.0.1' } };
    const res = { locals: { requestId: 'req-reset' }, status, json, setHeader: vi.fn() };

    await middleware(req as never, res as never, next);
    now = 3_500;
    await middleware(req as never, res as never, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(status).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });
});
