---
name: cpp-engine
description: Implement and validate the C++ max-flow engine for doctor-day assignment. Use when Codex must model graph capacities, build solver input/output, implement Edmonds-Karp, optimize runtime, and add unit/regression tests for feasibility and assignment extraction.
---

# Cpp Engine

## Objective
Deliver a correct, testable, and integration-ready solver binary for scheduling feasibility.

## Workflow
1. Validate domain contract (input/output JSON).
2. Build graph mapping:
   - `source -> doctor(i)` capacity `C_i`
   - `doctor(i) -> doctor_period(i,k)` capacity `1`
   - `doctor_period(i,k) -> day(d)` capacity `1`
   - `day(d) -> sink` capacity `R_d`
3. Implement Edmonds-Karp.
4. Extract assignment mapping from residual flow.
5. Return feasibility summary and uncovered demand.
6. Add tests and benchmark representative cases.

## Correctness Checks
- Flow value equals total daily demand for feasible scenarios.
- No doctor exceeds `C_i`.
- No doctor is assigned more than one day per period.
- Assignments only use declared availability.

## Integration Contract
- Input: JSON via stdin.
- Output: JSON via stdout.
- Error path: non-zero exit + JSON error message to stderr/stdout (pick one and document).

## References
- Read `references/model-checklist.md` before coding algorithm changes.
- Read `references/test-matrix.md` before adding/adjusting tests.
