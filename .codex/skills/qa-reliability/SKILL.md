---
name: qa-reliability
description: Define and enforce quality strategy across the monorepo. Use when Codex needs to design test plans, CI gates, coverage policy, integration test fixtures, regression suites, and release-readiness checks for C++ engine, API, and frontend.
---

# Qa Reliability

## Objective
Prevent regressions and make release status explicit with measurable gates.

## Workflow
1. Map critical user flows and risk hotspots.
2. Define test pyramid per module (unit, integration, e2e).
3. Define mandatory CI gates and thresholds.
4. Create regression suite from historical or expected failures.
5. Produce release-readiness checklist.

## Quality Gates
- Lint and typecheck pass.
- Unit and integration suites pass.
- Critical e2e scenario passes.
- Coverage threshold met for changed modules.
- No unresolved high-severity defects.

## Reporting Contract
Always return:
1. Findings ordered by severity.
2. Gaps in current tests.
3. Recommended next tests.
4. Explicit go/no-go recommendation.

## References
- Read `references/ci-gates.md` for baseline gates.
- Read `references/release-checklist.md` before final sign-off.
