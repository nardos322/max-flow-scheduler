---
name: planner-architect
description: Design and maintain implementation plans for the max-flow scheduler monorepo. Use when Codex needs to define roadmap, epics, sprint scope, architecture decisions, delivery sequencing, risks, and Definition of Done for C++ engine, Node/Express API, React frontend, and shared contracts.
---

# Planner Architect

## Objective
Create execution-ready plans that de-risk delivery and keep team coordination simple.

## Workflow
1. Confirm product scope and non-negotiables.
2. Translate scope into architecture modules and boundaries.
3. Produce sprint plan with explicit deliverables and DoD.
4. Produce backlog items with acceptance criteria and dependencies.
5. Identify top risks and mitigations.
6. Publish execution checklist for handoff to implementation agents.

## Output Contract
Return artifacts in this order:
1. Architecture map.
2. Sprint roadmap.
3. Prioritized backlog.
4. Risks and mitigations.
5. Open assumptions/questions.

## Planning Rules
- Keep each backlog item testable.
- Avoid cross-module coupling in the same story unless unavoidable.
- Frontload shared contracts and fixtures before integration work.
- Define exit criteria per sprint, not only per epic.
- Include one rollback or fallback path for risky integrations.

## References
- Read `references/sprint-template.md` to structure each sprint.
- Read `references/definition-of-done.md` to enforce quality gates.
