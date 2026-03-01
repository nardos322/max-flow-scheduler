import { HttpError } from '../errors/http.error.js';

export type AuthMode = 'jwks' | 'public-key' | 'shared-secret';

export type AuthRuntimeConfig = {
  mode: AuthMode;
  issuer: string;
  audience: string;
};

function readRequired(value: string | undefined, envName: string): string {
  const parsed = value?.trim();
  if (!parsed) {
    throw new HttpError(500, { error: `${envName} is not configured` });
  }
  return parsed;
}

function readOptional(value: string | undefined): string | null {
  const parsed = value?.trim();
  if (!parsed) {
    return null;
  }
  return parsed;
}

export function resolveAuthRuntimeConfig(env: NodeJS.ProcessEnv = process.env): AuthRuntimeConfig {
  const issuer = readRequired(env.JWT_ISSUER, 'JWT_ISSUER');
  const audience = readRequired(env.JWT_AUDIENCE, 'JWT_AUDIENCE');

  const jwksUrl = readOptional(env.JWT_JWKS_URL);
  if (jwksUrl) {
    try {
      void new URL(jwksUrl);
    } catch {
      throw new HttpError(500, { error: 'JWT_JWKS_URL is not a valid URL' });
    }
    return { mode: 'jwks', issuer, audience };
  }

  if (readOptional(env.JWT_PUBLIC_KEY)) {
    return { mode: 'public-key', issuer, audience };
  }

  if (readOptional(env.JWT_SECRET)) {
    return { mode: 'shared-secret', issuer, audience };
  }

  throw new HttpError(500, { error: 'JWT auth is not configured: set JWT_JWKS_URL, JWT_PUBLIC_KEY, or JWT_SECRET' });
}
