---
name: modeling-theory
description: Formalize and verify the max-flow model behind doctor scheduling. Use when Codex needs to define graph construction, prove model correctness, reason about constraints, derive complexity, and explain why feasibility decisions from flow correspond to valid assignments.
---

# Modeling Theory

## Objective
Guarantee that the mathematical model is correct, explainable, and implementation-ready.

## Workflow
1. Define sets, variables, and constraints from business rules.
2. Map constraints to graph nodes/edges/capacities.
3. State feasibility criterion via max-flow value.
4. Provide proof sketch for soundness and completeness.
5. Derive algorithmic complexity and assumptions.

## Proof Checklist
- Soundness: every integral flow defines a valid assignment.
- Completeness: every valid assignment induces a feasible flow.
- Capacity constraints map 1:1 to business limits.
- Integrality argument is explicit.

## Required Output
1. Formal model notation.
2. Graph construction procedure.
3. Correctness proof sketch.
4. Complexity analysis.

## References
- Read `references/formal-template.md` for notation layout.
- Read `references/proof-outline.md` for proof structure.
