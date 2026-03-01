# Runbook: Release Operations

## Scope
- API (`apps/api`) and engine (`services/engine-cpp`) release flow.
- Local smoke run via docker compose.
- Rollback procedure based on image retagging.

## Assumptions
- GitHub Actions has `packages:write` permission for GHCR.
- Release tags use SemVer format `vX.Y.Z`.
- Consumers deploy either fixed tag or `latest`.

## 1. Pre-release checklist
1. Verify working tree is clean on `main`.
2. Run full validation:
```bash
pnpm run ci
pnpm bench:engine-cpp
pnpm bench:engine-cpp:check
```
3. Confirm changelog updated: `CHANGELOG.md`.
4. Confirm auth production config:
   - `JWT_JWKS_URL`, `JWT_ISSUER`, `JWT_AUDIENCE` definidos.
   - `AUTH_DEV_TOKEN_ENABLED=false`.
   - referencia: `docs/auth-oidc-jwks-operations.md`.

## 2. Build and run locally with Docker
```bash
docker compose -f infra/docker-compose.yml build
docker compose -f infra/docker-compose.yml up -d api
docker compose -f infra/docker-compose.yml logs -f api
```

API default URL:
- `http://localhost:3000`

## 3. Publish a release
1. Create and push release tag:
```bash
git tag -a v0.3.0 -m "release: v0.3.0"
git push origin v0.3.0
```
2. Wait for workflow `Release` to finish:
- `.github/workflows/release.yml`
3. Validate images in GHCR:
- `ghcr.io/<owner>/<repo>-api:v0.3.0`
- `ghcr.io/<owner>/<repo>-engine:v0.3.0`

## 4. Rollback
Trigger workflow:
- `.github/workflows/rollback.yml`
- Input `version` with last known good tag (example `v0.2.4`)

Effect:
- Retags `ghcr` API/engine images from `<version>` to `latest`.

Post-rollback checks:
1. Restart deployment referencing `latest` (or pin to target tag).
2. Run health check endpoint:
```bash
curl -sS http://localhost:3000/health
```
3. Execute one smoke solve request to confirm end-to-end behavior.

## 5. Incident notes
After rollback, register:
1. Root cause summary.
2. Blast radius.
3. Corrective action and preventive action.
