# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- Prisma + SQLite persistence for sprint entities (`Sprint`, `SprintDoctor`, `SprintAvailability`, `SprintRun`).
- Shared fixture catalog with expected outcomes consumed by domain/API/engine tests.
- API hardening middleware:
  - security headers
  - rate limiting
  - JSON body size limits
  - parser error normalization (`400/413`)
  - sensitive error detail sanitization for `5xx`.
- CI security secret scan (`gitleaks`).
- Dockerfiles for API and engine.
- Release and rollback GitHub workflows for GHCR images.

### Changed
- Sprint repositories cut over to Prisma-only (removed memory/json fallback).
- Benchmarks now include full valid fixture catalog + dense synthetic scenarios.
- Engine benchmark budget checker with `go/warn/no-go` thresholds.

### Docs
- Formal review of implemented max-flow model.
- Fixture outcomes policy and consumer mapping.
- Release workflow now includes automated image publication and rollback operation.
