import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@scheduler/domain';
import { HttpError } from '../../errors/http.error.js';

export type ActorLocals = {
  actor?: {
    role: UserRole;
    userId: string;
  };
};

function parseRole(raw: unknown): UserRole | null {
  if (raw === 'doctor' || raw === 'planner') {
    return raw;
  }
  return null;
}

type JwtClaims = {
  sub?: unknown;
  role?: unknown;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new HttpError(500, { error: 'JWT_SECRET is not configured' });
  }
  return secret;
}

function getJwtIssuer(): string {
  const issuer = process.env.JWT_ISSUER?.trim();
  if (!issuer) {
    throw new HttpError(500, { error: 'JWT_ISSUER is not configured' });
  }
  return issuer;
}

function getJwtAudience(): string {
  const audience = process.env.JWT_AUDIENCE?.trim();
  if (!audience) {
    throw new HttpError(500, { error: 'JWT_AUDIENCE is not configured' });
  }
  return audience;
}

export const resolveActorMiddleware: RequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    next(new HttpError(401, { error: 'Missing bearer token' }));
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();
  let claims: JwtClaims;
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      audience: getJwtAudience(),
      issuer: getJwtIssuer(),
    });
    if (typeof payload === 'string' || !payload) {
      next(new HttpError(401, { error: 'Invalid or expired JWT' }));
      return;
    }
    claims = payload as JwtClaims;
  } catch {
    next(new HttpError(401, { error: 'Invalid or expired JWT' }));
    return;
  }

  const role = parseRole(claims.role);
  const userId = typeof claims.sub === 'string' ? claims.sub.trim() : '';

  if (!role || userId.length === 0) {
    next(new HttpError(401, { error: 'Missing required JWT claims' }));
    return;
  }

  (res.locals as ActorLocals).actor = {
    role,
    userId,
  };

  next();
};

export function requireRoleMiddleware(...allowedRoles: UserRole[]): RequestHandler {
  return (_req, res, next) => {
    const actor = (res.locals as ActorLocals).actor;
    if (!actor) {
      next(new HttpError(500, { error: 'Actor not resolved' }));
      return;
    }

    if (!allowedRoles.includes(actor.role)) {
      next(new HttpError(403, { error: 'Forbidden for actor role' }));
      return;
    }

    next();
  };
}
