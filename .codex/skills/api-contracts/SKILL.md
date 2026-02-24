---
name: api-contracts
description: Design and enforce API contracts for the scheduling platform using Node.js, Express, TypeScript, and Zod. Use when Codex needs to define request/response schemas, validation rules, error formats, endpoint behavior, and compatibility rules between frontend, API, and C++ engine integration.
---

# Api Contracts

## Objective
Keep API behavior predictable through strict schemas, explicit errors, and stable versioning.

## Workflow
1. Define endpoint purpose and I/O boundaries.
2. Specify Zod request and response schemas in shared domain package.
3. Define validation errors and HTTP mapping.
4. Define compatibility rules with engine input/output contract.
5. Add contract tests and regression fixtures.

## Rules
- Validate at the API boundary before calling the engine.
- Return normalized error shape for all non-2xx responses.
- Version contract changes and avoid silent breaking changes.
- Keep schema logic centralized to avoid drift.

## Required Output
1. Endpoint contract summary.
2. Zod schemas list.
3. Error catalog (`code`, `httpStatus`, `message`, `details`).
4. Contract test cases.

## References
- Read `references/error-catalog-template.md` for error standards.
- Read `references/endpoint-checklist.md` for endpoint definition gates.
