# Auth OIDC/JWKS Operations

## Scope
Guia operativa para autenticar la API con JWT emitido por IdP externo usando OIDC/JWKS.

## Required env vars
- `JWT_ISSUER`: issuer esperado del token.
- `JWT_AUDIENCE`: audience esperado del token.
- `JWT_JWKS_URL`: JWKS endpoint del IdP (recomendado para staging/prod).

## Optional env vars
- `AUTH_ROLE_CLAIM_PATHS`: paths de claims para resolver rol, separados por coma.
  - Default: `role,roles,realm_access.roles`
- `AUTH_DEV_TOKEN_ENABLED`: solo para desarrollo local.

## Non-production bootstrap token
`/auth/dev/token` queda habilitado solo cuando:
1. `NODE_ENV` no es `production`
2. `AUTH_DEV_TOKEN_ENABLED=true`
3. modo auth runtime `shared-secret` (`JWT_SECRET`)

En `production` la ruta responde `404`.

## Required JWT claims
- `sub` (string no vacio): se usa como `actor.userId`.
- rol: debe resolverse a `doctor` o `planner` via `AUTH_ROLE_CLAIM_PATHS`.

## Troubleshooting
- `401 Missing bearer token`: falta header `Authorization: Bearer <token>`.
- `401 Invalid or expired JWT`: firma/exp/iss/aud incorrectos.
- `401 Missing required JWT claims`: falta `sub` o no hay rol mapeable.
- `403 Forbidden for actor role`: token valido, pero rol no autorizado para endpoint.

## Recommended production policy
- Usar `JWT_JWKS_URL` + `JWT_ISSUER` + `JWT_AUDIENCE`.
- Mantener `AUTH_DEV_TOKEN_ENABLED=false`.
- No configurar `JWT_SECRET` en producción.
