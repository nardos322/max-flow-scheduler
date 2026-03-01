import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';
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

function getJwtPublicKey(): string | null {
  const key = process.env.JWT_PUBLIC_KEY?.trim();
  if (!key) {
    return null;
  }
  return key;
}

function getJwtJwksUrl(): string | null {
  const jwksUrl = process.env.JWT_JWKS_URL?.trim();
  if (!jwksUrl) {
    return null;
  }
  return jwksUrl;
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

const jwksByUrl = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getRemoteJwks(url: URL): ReturnType<typeof createRemoteJWKSet> {
  const key = url.toString();
  const cached = jwksByUrl.get(key);
  if (cached) {
    return cached;
  }

  const created = createRemoteJWKSet(url);
  jwksByUrl.set(key, created);
  return created;
}

async function verifyJwtToken(token: string): Promise<JwtClaims> {
  const issuer = getJwtIssuer();
  const audience = getJwtAudience();
  const jwksUrl = getJwtJwksUrl();

  if (jwksUrl) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(jwksUrl);
    } catch {
      throw new HttpError(500, { error: 'JWT_JWKS_URL is not a valid URL' });
    }

    const { payload } = await jwtVerify(token, getRemoteJwks(parsedUrl), {
      algorithms: ['RS256'],
      issuer,
      audience,
    });
    return payload as JwtClaims;
  }

  const publicKey = getJwtPublicKey();
  if (publicKey) {
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      audience,
      issuer,
    });
    if (typeof payload === 'string' || !payload) {
      throw new Error('INVALID_PAYLOAD');
    }
    return payload as JwtClaims;
  }

  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      audience,
      issuer,
    });
    if (typeof payload === 'string' || !payload) {
      throw new Error('INVALID_PAYLOAD');
    }
    return payload as JwtClaims;
  }

  throw new HttpError(500, { error: 'JWT auth is not configured: set JWT_JWKS_URL, JWT_PUBLIC_KEY, or JWT_SECRET' });
}

export const resolveActorMiddleware: RequestHandler = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    next(new HttpError(401, { error: 'Missing bearer token' }));
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();
  let claims: JwtClaims;
  try {
    claims = await verifyJwtToken(token);
  } catch (error) {
    if (error instanceof HttpError && error.statusCode >= 500) {
      next(error);
      return;
    }

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
