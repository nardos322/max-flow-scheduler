---
name: frontend-planner-ui
description: Build and evolve the scheduling frontend with React, Vite, TypeScript, and Zod-driven forms. Use when Codex needs to implement planner UX, availability and demand input flows, solver result visualization, accessibility checks, and frontend tests for critical interactions.
---

# Frontend Planner Ui

## Objective
Deliver a planner interface that is clear, fast, and resilient to invalid user input.

## Workflow
1. Define user flow for scenario creation and solve action.
2. Implement typed form models and Zod-based validation.
3. Integrate API calls with loading/error/result states.
4. Render assignment results and uncovered demand clearly.
5. Add component and e2e coverage for critical path.

## UX Rules
- Prevent invalid submissions before API call.
- Keep validation messages field-specific.
- Separate global errors from field errors.
- Highlight uncovered days with high visual contrast.

## Required Output
1. Screen/component map.
2. Data flow map (form state -> API -> result state).
3. Validation strategy.
4. Test cases for main user journey.

## References
- Read `references/screen-map.md` for initial UI decomposition.
- Read `references/test-scenarios.md` for minimum coverage scenarios.
