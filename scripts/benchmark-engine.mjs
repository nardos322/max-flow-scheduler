#!/usr/bin/env node
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const DEFAULT_ENGINE_BINARY = 'services/engine-cpp/build/scheduler_engine';
const DEFAULT_RUNS = 10;
const DEFAULT_OUTPUT = 'docs/benchmarks/engine-smoke-baseline.json';

function parseArgs(argv) {
  const parsed = {
    runs: DEFAULT_RUNS,
    engine: DEFAULT_ENGINE_BINARY,
    output: DEFAULT_OUTPUT,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === '--runs' || arg === '-n') && argv[i + 1]) {
      parsed.runs = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--engine' && argv[i + 1]) {
      parsed.engine = argv[i + 1];
      i += 1;
    } else if (arg === '--output' && argv[i + 1]) {
      parsed.output = argv[i + 1];
      i += 1;
    }
  }

  if (!Number.isInteger(parsed.runs) || parsed.runs <= 0) {
    throw new Error(`Invalid --runs value: ${parsed.runs}`);
  }

  return parsed;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function summarize(timesMs) {
  const total = timesMs.reduce((acc, value) => acc + value, 0);
  return {
    runs: timesMs.length,
    minMs: Number(Math.min(...timesMs).toFixed(3)),
    maxMs: Number(Math.max(...timesMs).toFixed(3)),
    avgMs: Number((total / timesMs.length).toFixed(3)),
    p50Ms: Number(percentile(timesMs, 50).toFixed(3)),
    p95Ms: Number(percentile(timesMs, 95).toFixed(3)),
  };
}

function buildScenario({ doctors, periods, daysPerPeriod, demandPerDay, maxTotalDaysPerDoctor, key }) {
  const periodEntries = [];
  const demands = [];
  const dayIds = [];

  for (let p = 1; p <= periods; p += 1) {
    const periodId = `p${p}`;
    const days = [];
    for (let d = 1; d <= daysPerPeriod; d += 1) {
      const dayId = `day-${p}-${d}`;
      days.push(dayId);
      dayIds.push({ dayId, periodId });
      demands.push({ dayId, requiredDoctors: demandPerDay });
    }
    periodEntries.push({ id: periodId, dayIds: days });
  }

  const doctorEntries = [];
  for (let i = 1; i <= doctors; i += 1) {
    doctorEntries.push({ id: `d${i}`, maxTotalDays: maxTotalDaysPerDoctor });
  }

  const availability = [];
  for (let i = 1; i <= doctors; i += 1) {
    for (const { dayId, periodId } of dayIds) {
      availability.push({ doctorId: `d${i}`, periodId, dayId });
    }
  }

  return {
    name: key,
    payload: {
      contractVersion: '1.0',
      doctors: doctorEntries,
      periods: periodEntries,
      demands,
      availability,
    },
  };
}

function loadFixtureScenario(key, filePath) {
  const payload = JSON.parse(readFileSync(resolve(filePath), 'utf8'));
  return { name: key, payload };
}

function countDays(payload) {
  return payload.periods.reduce((acc, period) => acc + period.dayIds.length, 0);
}

function runScenario({ engineBinary, scenario, runs }) {
  const tempDir = mkdtempSync(resolve(tmpdir(), 'engine-bench-'));
  const inputPath = resolve(tempDir, `${scenario.name}.json`);
  writeFileSync(inputPath, JSON.stringify(scenario.payload), 'utf8');

  const timesMs = [];

  try {
    for (let i = 0; i < runs; i += 1) {
      const inputFd = openSync(inputPath, 'r');
      const start = process.hrtime.bigint();
      const result = spawnSync(resolve(engineBinary), [], {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30_000,
        stdio: [inputFd, 'pipe', 'pipe'],
      });
      closeSync(inputFd);
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;

      if (result.error) {
        throw result.error;
      }
      if (result.status !== 0) {
        throw new Error(
          `Engine failed for scenario '${scenario.name}' with code ${result.status}: ${result.stderr}`,
        );
      }

      JSON.parse(result.stdout);
      timesMs.push(elapsedMs);
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  return {
    scenario: scenario.name,
    inputSize: {
      doctors: scenario.payload.doctors.length,
      periods: scenario.payload.periods.length,
      days: countDays(scenario.payload),
      demands: scenario.payload.demands.length,
      availability: scenario.payload.availability.length,
    },
    metrics: summarize(timesMs),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const scenarios = [
    loadFixtureScenario('small-feasible-fixture', 'packages/domain/fixtures/feasible.request.json'),
    loadFixtureScenario('small-infeasible-fixture', 'packages/domain/fixtures/infeasible.request.json'),
    buildScenario({
      key: 'medium-dense-feasible',
      doctors: 12,
      periods: 3,
      daysPerPeriod: 5,
      demandPerDay: 1,
      maxTotalDaysPerDoctor: 3,
    }),
    buildScenario({
      key: 'large-dense-feasible',
      doctors: 20,
      periods: 4,
      daysPerPeriod: 6,
      demandPerDay: 1,
      maxTotalDaysPerDoctor: 4,
    }),
  ];

  const results = scenarios.map((scenario) =>
    runScenario({ engineBinary: args.engine, scenario, runs: args.runs }),
  );

  const output = {
    benchmark: 'engine-smoke',
    generatedAt: new Date().toISOString(),
    engineBinary: resolve(args.engine),
    runsPerScenario: args.runs,
    results,
  };

  writeFileSync(resolve(args.output), `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log('Engine benchmark complete');
  for (const result of results) {
    const m = result.metrics;
    console.log(
      `${result.scenario}: avg=${m.avgMs}ms p50=${m.p50Ms}ms p95=${m.p95Ms}ms max=${m.maxMs}ms [days=${result.inputSize.days}, availability=${result.inputSize.availability}]`,
    );
  }
  console.log(`Saved: ${resolve(args.output)}`);
}

main();
