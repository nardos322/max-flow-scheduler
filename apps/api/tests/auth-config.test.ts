import { describe, expect, it } from 'vitest';
import { HttpError } from '../src/errors/http.error.js';
import { resolveAuthRuntimeConfig } from '../src/config/auth-config.js';

describe('resolveAuthRuntimeConfig', () => {
  it('uses shared-secret mode when JWT_SECRET is present', () => {
    const config = resolveAuthRuntimeConfig({
      JWT_ISSUER: 'scheduler-dev',
      JWT_AUDIENCE: 'scheduler-api',
      JWT_SECRET: 'dev-secret',
    } as NodeJS.ProcessEnv);

    expect(config.mode).toBe('shared-secret');
  });

  it('uses public-key mode when JWT_PUBLIC_KEY is present', () => {
    const config = resolveAuthRuntimeConfig({
      JWT_ISSUER: 'scheduler-staging',
      JWT_AUDIENCE: 'scheduler-api',
      JWT_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----',
    } as NodeJS.ProcessEnv);

    expect(config.mode).toBe('public-key');
  });

  it('prioritizes jwks mode when JWT_JWKS_URL is present', () => {
    const config = resolveAuthRuntimeConfig({
      JWT_ISSUER: 'scheduler-prod',
      JWT_AUDIENCE: 'scheduler-api',
      JWT_PUBLIC_KEY: 'ignored',
      JWT_SECRET: 'ignored',
      JWT_JWKS_URL: 'https://idp.example.com/.well-known/jwks.json',
    } as NodeJS.ProcessEnv);

    expect(config.mode).toBe('jwks');
  });

  it('fails when JWT_JWKS_URL is malformed', () => {
    expect(() =>
      resolveAuthRuntimeConfig({
        JWT_ISSUER: 'scheduler-prod',
        JWT_AUDIENCE: 'scheduler-api',
        JWT_JWKS_URL: 'not-a-url',
      } as NodeJS.ProcessEnv),
    ).toThrowError(HttpError);
  });
});
