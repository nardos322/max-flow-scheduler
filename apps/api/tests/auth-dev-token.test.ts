import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { issueDevTokenController } from '../src/controllers/auth/auth-dev-token.controller.js';
import { validateIssueDevTokenMiddleware } from '../src/middlewares/auth/validate-dev-token.middleware.js';

describe('dev token bootstrap', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'dev-secret';
    process.env.JWT_ISSUER = 'scheduler-auth-dev';
    process.env.JWT_AUDIENCE = 'scheduler-api';
    process.env.AUTH_DEV_TOKEN_ENABLED = 'true';
    delete process.env.JWT_JWKS_URL;
    delete process.env.JWT_PUBLIC_KEY;
  });

  it('validates request payload', async () => {
    const next = vi.fn();
    const res = { locals: {} };

    await validateIssueDevTokenMiddleware(
      { body: { userId: '', role: 'admin' } } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'Invalid dev token payload' }));
  });

  it('returns 404 when bootstrap is disabled', async () => {
    process.env.AUTH_DEV_TOKEN_ENABLED = 'false';
    const next = vi.fn();

    await issueDevTokenController(
      {} as never,
      { locals: { issueDevTokenRequest: { userId: 'planner-1', role: 'planner' } } } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Route not found' }));
  });

  it('returns 422 when runtime auth is not shared-secret', async () => {
    process.env.JWT_JWKS_URL = 'https://idp.example.com/.well-known/jwks.json';
    const next = vi.fn();

    await issueDevTokenController(
      {} as never,
      { locals: { issueDevTokenRequest: { userId: 'planner-1', role: 'planner' } } } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: 'Dev token issuance requires shared-secret auth mode (JWT_SECRET)',
      }),
    );
  });

  it('returns 404 when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';
    const next = vi.fn();

    await issueDevTokenController(
      {} as never,
      { locals: { issueDevTokenRequest: { userId: 'planner-1', role: 'planner' } } } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Route not found' }));
  });

  it('issues valid HS256 JWT for planner', async () => {
    const next = vi.fn();
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();

    await issueDevTokenController(
      {} as never,
      {
        locals: {
          issueDevTokenRequest: {
            userId: 'planner-42',
            role: 'planner',
            expiresInSeconds: 1800,
          },
        },
        status,
        json,
      } as never,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(201);

    const body = json.mock.calls[0]?.[0] as {
      accessToken: string;
      tokenType: string;
      expiresInSeconds: number;
      issuer: string;
      audience: string;
    };

    expect(body.tokenType).toBe('Bearer');
    expect(body.expiresInSeconds).toBe(1800);
    expect(body.issuer).toBe('scheduler-auth-dev');
    expect(body.audience).toBe('scheduler-api');

    const decoded = jwt.verify(body.accessToken, 'dev-secret', {
      algorithms: ['HS256'],
      issuer: 'scheduler-auth-dev',
      audience: 'scheduler-api',
    }) as jwt.JwtPayload;

    expect(decoded.sub).toBe('planner-42');
    expect(decoded.role).toBe('planner');
  });
});
