import type { RequestHandler } from 'express';
import type { RequestContextLocals } from './request-context.middleware.js';

type RateLimitBucket = {
  count: number;
  windowStartedAt: number;
};

type RateLimitOptions = {
  maxRequests: number;
  now: () => number;
  windowMs: number;
};

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 120;
const DEFAULT_BODY_LIMIT = '100kb';

function parsePositiveInt(input: string | undefined, fallback: number): number {
  if (!input) {
    return fallback;
  }

  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function resolveBodyLimit(): string {
  const configured = process.env.API_BODY_LIMIT?.trim();
  if (!configured) {
    return DEFAULT_BODY_LIMIT;
  }

  return configured;
}

function resolveRateLimitConfig(): RateLimitOptions {
  return {
    windowMs: parsePositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
    maxRequests: parsePositiveInt(process.env.API_RATE_LIMIT_MAX_REQUESTS, DEFAULT_RATE_LIMIT_MAX_REQUESTS),
    now: () => Date.now(),
  };
}

export const securityHeadersMiddleware: RequestHandler = (_req, res, next) => {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('permissions-policy', 'camera=(), geolocation=(), microphone=()');
  res.setHeader('content-security-policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader('cross-origin-resource-policy', 'same-origin');
  next();
};

export function createRateLimitMiddleware(options?: Partial<RateLimitOptions>): RequestHandler {
  const config = { ...resolveRateLimitConfig(), ...options };
  const buckets = new Map<string, RateLimitBucket>();

  return (req, res, next) => {
    const now = config.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = buckets.get(key);

    if (!current || now - current.windowStartedAt >= config.windowMs) {
      buckets.set(key, { count: 1, windowStartedAt: now });
      next();
      return;
    }

    if (current.count >= config.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((config.windowMs - (now - current.windowStartedAt)) / 1000));
      res.setHeader('retry-after', String(retryAfterSeconds));

      const requestId = (res.locals as RequestContextLocals).requestId;
      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        requestId,
      });
      return;
    }

    current.count += 1;
    buckets.set(key, current);
    next();
  };
}

export const rateLimitMiddleware: RequestHandler = createRateLimitMiddleware();
