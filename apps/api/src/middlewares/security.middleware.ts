import type { RequestHandler } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { RequestContextLocals } from './request-context.middleware.js';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
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

  return rateLimit({
    legacyHeaders: false,
    max: config.maxRequests,
    standardHeaders: false,
    windowMs: config.windowMs,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown'),
    handler: (req, res) => {
      const resetTime = (req as { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime?.getTime();
      const retryAfterSeconds = resetTime
        ? Math.max(1, Math.ceil((resetTime - Date.now()) / 1000))
        : Math.max(1, Math.ceil(config.windowMs / 1000));
      res.setHeader('retry-after', String(retryAfterSeconds));

      const requestId = (res.locals as RequestContextLocals).requestId;
      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        requestId,
      });
    },
  });
}

export const rateLimitMiddleware: RequestHandler = createRateLimitMiddleware();
