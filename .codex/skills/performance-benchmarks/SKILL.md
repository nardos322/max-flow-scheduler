---
name: performance-benchmarks
description: Define and run performance benchmarks for solver, API, and critical frontend flows. Use when Codex needs latency/throughput baselines, load scenarios, bottleneck analysis, and performance budgets tied to release gates.
---

# Performance Benchmarks

## Objective
Make performance measurable, repeatable, and enforced by budgets.

## Workflow
1. Define critical performance paths and SLAs.
2. Build benchmark datasets and run methodology.
3. Measure baseline and regressions.
4. Isolate bottlenecks and propose fixes.
5. Publish budget thresholds for CI/release checks.

## Required Output
1. Benchmark matrix.
2. Baseline metrics.
3. Bottleneck findings.
4. Budget recommendations.

## References
- Read `references/benchmark-matrix-template.md`.
- Read `references/perf-budget-template.md`.
