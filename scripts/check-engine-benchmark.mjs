#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_INPUT = 'docs/benchmarks/engine-smoke-baseline.json';
const DEFAULT_BUDGET = 'docs/benchmarks/engine-smoke-budgets.json';

function parseArgs(argv) {
  const parsed = {
    input: DEFAULT_INPUT,
    budget: DEFAULT_BUDGET,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input' && argv[i + 1]) {
      parsed.input = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--budget' && argv[i + 1]) {
      parsed.budget = argv[i + 1];
      i += 1;
    }
  }

  return parsed;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = JSON.parse(readFileSync(resolve(args.input), 'utf8'));
  const budget = JSON.parse(readFileSync(resolve(args.budget), 'utf8'));

  const warnTolerance = Number(budget.warnTolerancePercent ?? 20);
  const scenarioMap = new Map(report.results.map((result) => [result.scenario, result]));

  let hasWarn = false;
  let hasNoGo = false;

  for (const expected of budget.scenarios) {
    const result = scenarioMap.get(expected.scenario);
    if (!result) {
      console.log(`[no-go] missing scenario '${expected.scenario}' in benchmark report`);
      hasNoGo = true;
      continue;
    }

    const p95 = Number(result.metrics.p95Ms);
    const threshold = Number(expected.maxP95Ms);
    const warnLimit = threshold * (1 + warnTolerance / 100);

    if (p95 <= threshold) {
      console.log(`[go] ${expected.scenario}: p95=${p95}ms <= ${threshold}ms`);
      continue;
    }

    if (p95 <= warnLimit) {
      console.log(`[warn] ${expected.scenario}: p95=${p95}ms > ${threshold}ms (warn limit ${warnLimit.toFixed(3)}ms)`);
      hasWarn = true;
      continue;
    }

    console.log(`[no-go] ${expected.scenario}: p95=${p95}ms > warn limit ${warnLimit.toFixed(3)}ms`);
    hasNoGo = true;
  }

  if (hasNoGo) {
    process.exitCode = 1;
    return;
  }

  if (hasWarn) {
    console.log('Benchmark check completed with warnings.');
    return;
  }

  console.log('Benchmark check passed.');
}

main();
