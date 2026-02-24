---
name: devops-release
description: Establish CI/CD, packaging, environment configuration, and release operations for the scheduler monorepo. Use when Codex needs to define pipelines, Docker strategy, deployment checks, rollback procedures, and release automation for API, frontend, and C++ engine services.
---

# Devops Release

## Objective
Provide repeatable builds and safe releases with explicit rollback paths.

## Workflow
1. Define build matrix by module (web, api, engine).
2. Define CI stages and required quality gates.
3. Define Docker images and runtime configs.
4. Define release process and rollback procedure.
5. Automate repetitive release checks.

## CI Rules
- Fail fast on lint/typecheck.
- Block release on failed integration/e2e tests.
- Keep artifacts traceable to commit SHA.
- Enforce environment parity through declarative configs.

## Required Output
1. CI/CD pipeline definition.
2. Containerization approach.
3. Environment variable contract.
4. Release and rollback runbook.

## References
- Read `references/pipeline-stages.md` for stage baseline.
- Read `references/release-runbook-template.md` for release checklist.
