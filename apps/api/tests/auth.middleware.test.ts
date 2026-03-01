import jwt from 'jsonwebtoken';
import { generateKeyPairSync } from 'node:crypto';
import { exportJWK } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireRoleMiddleware, resolveActorMiddleware } from '../src/middlewares/auth/actor.middleware.js';

function signTestJwt(claims: Record<string, unknown>, secret: string): string {
  return jwt.sign(claims, secret, { algorithm: 'HS256' });
}

describe('resolveActorMiddleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.JWT_PUBLIC_KEY;
    delete process.env.JWT_JWKS_URL;
    delete process.env.AUTH_ROLE_CLAIM_PATHS;
    process.env.JWT_ISSUER = 'scheduler-api-tests';
    process.env.JWT_AUDIENCE = 'scheduler-api';
  });

  it('rejects when bearer token is missing', async () => {
    const next = vi.fn();

    await resolveActorMiddleware({ headers: {} } as never, { locals: {} } as never, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: 'Missing bearer token' }));
  });

  it('rejects token with wrong issuer', async () => {
    const token = signTestJwt(
      {
        sub: 'planner-1',
        role: 'planner',
        iss: 'unexpected-issuer',
        aud: 'scheduler-api',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      'test-secret',
    );

    const next = vi.fn();
    await resolveActorMiddleware(
      { headers: { authorization: `Bearer ${token}` } } as never,
      { locals: {} } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: 'Invalid or expired JWT' }));
  });

  it('rejects token with missing required claims', async () => {
    const token = signTestJwt(
      {
        iss: 'scheduler-api-tests',
        aud: 'scheduler-api',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      'test-secret',
    );

    const next = vi.fn();
    await resolveActorMiddleware(
      { headers: { authorization: `Bearer ${token}` } } as never,
      { locals: {} } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: 'Missing required JWT claims' }));
  });

  it('resolves actor from valid token', async () => {
    const token = signTestJwt(
      {
        sub: 'doctor-1',
        role: 'doctor',
        iss: 'scheduler-api-tests',
        aud: 'scheduler-api',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      'test-secret',
    );

    const next = vi.fn();
    const res = { locals: {} };

    await resolveActorMiddleware(
      { headers: { authorization: `Bearer ${token}` } } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect(res.locals).toEqual({ actor: { role: 'doctor', userId: 'doctor-1' } });
  });

  it('resolves actor role from roles array claim', async () => {
    const token = signTestJwt(
      {
        sub: 'planner-roles-array',
        roles: ['planner'],
        iss: 'scheduler-api-tests',
        aud: 'scheduler-api',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      'test-secret',
    );

    const next = vi.fn();
    const res = { locals: {} };

    await resolveActorMiddleware(
      { headers: { authorization: `Bearer ${token}` } } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect(res.locals).toEqual({ actor: { role: 'planner', userId: 'planner-roles-array' } });
  });

  it('resolves actor role from nested realm_access.roles claim', async () => {
    const token = signTestJwt(
      {
        sub: 'doctor-realm',
        realm_access: {
          roles: ['doctor'],
        },
        iss: 'scheduler-api-tests',
        aud: 'scheduler-api',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      'test-secret',
    );

    const next = vi.fn();
    const res = { locals: {} };

    await resolveActorMiddleware(
      { headers: { authorization: `Bearer ${token}` } } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect(res.locals).toEqual({ actor: { role: 'doctor', userId: 'doctor-realm' } });
  });

  it('uses AUTH_ROLE_CLAIM_PATHS to resolve custom nested role claim', async () => {
    process.env.AUTH_ROLE_CLAIM_PATHS = 'custom.claim.role';
    const token = signTestJwt(
      {
        sub: 'planner-custom-claim',
        custom: {
          claim: {
            role: 'planner',
          },
        },
        iss: 'scheduler-api-tests',
        aud: 'scheduler-api',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      'test-secret',
    );

    const next = vi.fn();
    const res = { locals: {} };

    await resolveActorMiddleware(
      { headers: { authorization: `Bearer ${token}` } } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect(res.locals).toEqual({ actor: { role: 'planner', userId: 'planner-custom-claim' } });
  });

  it('resolves actor from valid RS256 token when JWT_PUBLIC_KEY is configured', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    process.env.JWT_PUBLIC_KEY = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    delete process.env.JWT_SECRET;

    const token = jwt.sign(
      {
        sub: 'planner-1',
        role: 'planner',
        iss: 'scheduler-api-tests',
        aud: 'scheduler-api',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      privateKey,
      { algorithm: 'RS256' },
    );

    const next = vi.fn();
    const res = { locals: {} };

    await resolveActorMiddleware(
      { headers: { authorization: `Bearer ${token}` } } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect(res.locals).toEqual({ actor: { role: 'planner', userId: 'planner-1' } });
  });

  it('resolves actor from valid RS256 token when JWT_JWKS_URL is configured', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const jwk = await exportJWK(publicKey);
    jwk.use = 'sig';
    jwk.alg = 'RS256';
    jwk.kid = 'test-jwks-key';

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ keys: [jwk] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as typeof fetch;

    try {
      process.env.JWT_JWKS_URL = 'https://idp.example.com/.well-known/jwks.json';
      delete process.env.JWT_PUBLIC_KEY;
      delete process.env.JWT_SECRET;

      const token = jwt.sign(
        {
          sub: 'planner-2',
          role: 'planner',
          iss: 'scheduler-api-tests',
          aud: 'scheduler-api',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        privateKey,
        { algorithm: 'RS256', keyid: 'test-jwks-key' },
      );

      const next = vi.fn();
      const res = { locals: {} };

      await resolveActorMiddleware(
        { headers: { authorization: `Bearer ${token}` } } as never,
        res as never,
        next,
      );

      expect(next).toHaveBeenCalledWith();
      expect(res.locals).toEqual({ actor: { role: 'planner', userId: 'planner-2' } });
      expect(globalThis.fetch).toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('requireRoleMiddleware', () => {
  it('rejects when actor role is not allowed', async () => {
    const next = vi.fn();

    await requireRoleMiddleware('planner')(
      {} as never,
      { locals: { actor: { role: 'doctor', userId: 'd1' } } } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, message: 'Forbidden for actor role' }));
  });

  it('allows when actor role is allowed', async () => {
    const next = vi.fn();

    await requireRoleMiddleware('doctor', 'planner')(
      {} as never,
      { locals: { actor: { role: 'doctor', userId: 'd1' } } } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });
});
