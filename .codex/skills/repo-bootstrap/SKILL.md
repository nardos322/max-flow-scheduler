---
name: repo-bootstrap
description: Initialize and maintain monorepo foundations for API, frontend, shared packages, and C++ services. Use when Codex needs to set up workspace layout, tooling, scripts, lint/format standards, TypeScript config, build wiring, and baseline CI for fast and consistent development.
---

# Repo Bootstrap

## Objective
Create a reliable project foundation so feature teams can deliver in parallel with minimal setup friction.

## Workflow
1. Create or verify monorepo directory layout.
2. Configure package manager workspaces.
3. Configure shared scripts for lint, test, build, typecheck.
4. Configure TS, ESLint, Prettier, and basic C++ build wiring.
5. Set up baseline CI.
6. Verify developer onboarding steps.

## Required Output
1. Final tree map.
2. Root scripts and command matrix.
3. Tooling decisions and rationale.
4. CI baseline status.

## References
- Read `references/monorepo-layout.md`.
- Read `references/tooling-baseline.md`.
