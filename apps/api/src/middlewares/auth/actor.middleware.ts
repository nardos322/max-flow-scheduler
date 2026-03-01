import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { UserRole } from '@scheduler/domain';
import { HttpError } from '../../errors/http.error.js';
import { resolveAuthRuntimeConfig } from '../../config/auth-config.js';

export type ActorLocals = {
  actor?: {
    role: UserRole;
    userId: string;
  };
};

const defaultRoleClaimPaths = ['role', 'roles', 'realm_access.roles'] as const;

function parseRole(raw: unknown): UserRole | null {
  if (raw === 'doctor' || raw === 'planner') {
    return raw;
  }
  return null;
}

type JwtClaims = {
  sub?: unknown;
  role?: unknown;
  [key: string]: unknown;
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

function getRoleClaimPaths(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env.AUTH_ROLE_CLAIM_PATHS?.trim();
  if (!raw) {
    return [...defaultRoleClaimPaths];
  }

  const unique = new Set(
    raw
      .split(',')
      .map((path) => path.trim())
      .filter((path) => path.length > 0),
  );

  return unique.size > 0 ? Array.from(unique) : [...defaultRoleClaimPaths];
}

function getClaimAtPath(payload: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.').map((segment) => segment.trim()).filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return undefined;
  }

  let current: unknown = payload;
  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function parseRoleFromClaims(claims: JwtClaims, env: NodeJS.ProcessEnv = process.env): UserRole | null {
  const roleClaimPaths = getRoleClaimPaths(env);
  const record = claims as Record<string, unknown>;

  for (const path of roleClaimPaths) {
    const claimValue = getClaimAtPath(record, path);
    const directRole = parseRole(claimValue);
    if (directRole) {
      return directRole;
    }

    if (Array.isArray(claimValue)) {
      for (const entry of claimValue) {
        const parsed = parseRole(entry);
        if (parsed) {
          return parsed;
        }
      }
    }
  }

  return null;
}

async function verifyJwtToken(token: string): Promise<JwtClaims> {
  const runtime = resolveAuthRuntimeConfig();
  const { issuer, audience } = runtime;
  const jwksUrl = getJwtJwksUrl();

  if (runtime.mode === 'jwks') {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(jwksUrl as string);
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

  if (runtime.mode === 'public-key') {
    const publicKey = getJwtPublicKey() as string;
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

  if (runtime.mode === 'shared-secret') {
    const secret = process.env.JWT_SECRET?.trim() as string;
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

  const role = parseRoleFromClaims(claims);
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
