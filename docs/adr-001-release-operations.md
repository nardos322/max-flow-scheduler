# ADR-001: Release Operations for API and Engine

- Status: accepted
- Date: 2026-03-01

## Context
- Backend MVP now includes:
  - API with Prisma/SQLite persistence.
  - C++ engine invoked by API as local binary.
- We need reproducible release artifacts and rollback path without introducing extra platform dependencies.

## Decision
- Build and publish Docker images for API and engine to GHCR on semantic release tags.
- Manage rollback by re-pointing `latest` to a prior immutable version tag via workflow dispatch.
- Keep operational procedures documented in runbook + changelog.

### Implementation
- Release workflow: `.github/workflows/release.yml`
- Rollback workflow: `.github/workflows/rollback.yml`
- Local orchestration: `infra/docker-compose.yml`
- Runbook: `docs/runbook-release-operations.md`
- Changelog: `CHANGELOG.md`

## Consequences
- Pros:
  - Repeatable release artifacts with traceable tag lineage.
  - Fast rollback without rebuild.
  - Clear operator guidance for day-2 tasks.
- Cons:
  - Requires GHCR package permissions in GitHub Actions.
  - `latest` tag remains mutable by design for rollback convenience.

## Alternatives considered
- Registry-less tarball artifacts only:
  - simpler permissions but slower rollout/rollback in real environments.
- Full GitOps deployment automation:
  - more robust long-term, but out of MVP scope and missing target cluster context.
