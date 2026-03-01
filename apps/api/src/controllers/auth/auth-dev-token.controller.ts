import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from '../../errors/http.error.js';
import { resolveAuthRuntimeConfig } from '../../config/auth-config.js';
import type { DevTokenLocals } from '../../middlewares/auth/validate-dev-token.middleware.js';

function isDevTokenIssuanceEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV?.trim().toLowerCase() === 'production') {
    return false;
  }

  const flag = env.AUTH_DEV_TOKEN_ENABLED?.trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

export const issueDevTokenController: RequestHandler = async (_req, res, next) => {
  try {
    if (!isDevTokenIssuanceEnabled()) {
      next(new HttpError(404, { error: 'Route not found' }));
      return;
    }

    const payload = (res.locals as DevTokenLocals).issueDevTokenRequest;
    if (!payload) {
      next(new HttpError(500, { error: 'Issue dev token payload not validated' }));
      return;
    }

    const runtime = resolveAuthRuntimeConfig();
    if (runtime.mode !== 'shared-secret') {
      next(new HttpError(422, { error: 'Dev token issuance requires shared-secret auth mode (JWT_SECRET)' }));
      return;
    }

    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
      next(new HttpError(500, { error: 'JWT_SECRET is not configured' }));
      return;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expiresInSeconds = payload.expiresInSeconds ?? 3600;
    const accessToken = jwt.sign(
      {
        sub: payload.userId,
        role: payload.role,
        iss: runtime.issuer,
        aud: runtime.audience,
        iat: nowInSeconds,
        exp: nowInSeconds + expiresInSeconds,
      },
      secret,
      { algorithm: 'HS256' },
    );

    res.status(201).json({
      accessToken,
      tokenType: 'Bearer',
      expiresInSeconds,
      issuer: runtime.issuer,
      audience: runtime.audience,
    });
  } catch (error) {
    next(error);
  }
};
