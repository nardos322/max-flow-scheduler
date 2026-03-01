# Security Secrets Policy

## Threat Surface Summary
- API runtime configuration (`DATABASE_URL`, `JWT_SECRET` y otros env vars).
- CI workflows con acceso a `GITHUB_TOKEN`.
- Fixtures/tests que pueden introducir credenciales reales por error.

## Secret Handling Rules
1. No commitear secretos reales en codigo, fixtures, tests ni docs.
2. Usar variables de entorno para credenciales y tokens.
3. Mantener solo templates (`.env.example`) con valores no sensibles.
4. Si un secreto se expone, rotarlo de inmediato y revocar accesos relacionados.

## CI Security Checks
- Secret scanning automatizado en CI con `gitleaks`:
  - Workflow: `.github/workflows/ci.yml` job `secret-scan`.
- Este gate corre en `push` a `main` y en `pull_request`.

## Remediation Priorities
1. `P0`: secreto real detectado en repo/PR -> bloquear merge, revocar/rotar.
2. `P1`: valor sensible en scripts locales o ejemplos ambiguos -> reemplazar por placeholder.
3. `P2`: hardening adicional (reglas custom de detectores, baseline de falsos positivos).
