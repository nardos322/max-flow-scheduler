---
name: integration-orchestrator
description: Coordinate cross-module integration between C++ engine, Node API, shared contracts, and frontend. Use when Codex needs to detect contract drift, define adapter boundaries, validate integration scenarios, and sequence multi-module changes safely.
---

# Integration Orchestrator

## Objective
Keep module interfaces aligned and prevent integration regressions.

## Workflow
1. Identify modules touched by the change.
2. Diff expected vs actual contract at each boundary.
3. Define adapter changes and migration order.
4. Add integration tests for cross-module behavior.
5. Report drift, blockers, and merge order.

## Required Output
1. Boundary map.
2. Contract drift report.
3. Integration change plan.
4. Verification checklist.

## References
- Read `references/boundary-map-template.md`.
- Read `references/integration-checklist.md`.
