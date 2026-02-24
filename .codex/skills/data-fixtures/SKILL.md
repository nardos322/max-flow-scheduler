---
name: data-fixtures
description: Create and maintain deterministic test fixtures for scheduling scenarios across engine, API, and frontend. Use when Codex needs reusable datasets, edge-case generators, scenario catalogs, and fixture versioning for regression and integration tests.
---

# Data Fixtures

## Objective
Provide high-signal, reusable data that catches regressions early.

## Workflow
1. Define fixture taxonomy (happy, edge, invalid, stress).
2. Generate deterministic fixture files.
3. Add metadata and expected outcomes.
4. Wire fixtures into engine/API/web tests.
5. Version fixtures when contracts change.

## Required Output
1. Fixture catalog.
2. Expected result definitions.
3. Consumer mapping by test suite.
4. Update policy.

## References
- Read `references/fixture-catalog-template.md`.
- Read `references/naming-conventions.md`.
