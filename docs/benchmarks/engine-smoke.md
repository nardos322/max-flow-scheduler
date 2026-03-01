# Engine Smoke Benchmark Baseline

Fecha de baseline: 2026-03-01

## Metodo
- Comando: `pnpm bench:engine-cpp`
- Chequeo de presupuesto: `pnpm bench:engine-cpp:check`
- Binary under test: `services/engine-cpp/build/scheduler_engine`
- Corridas por escenario: 10
- Script: `scripts/benchmark-engine.mjs`
- Salida cruda: `docs/benchmarks/engine-smoke-baseline.json`
- Presupuestos: `docs/benchmarks/engine-smoke-budgets.json`
- Matrix final: fixtures compartidos (`packages/domain/fixtures/catalog.json`) + escenarios densos sinteticos.

## Benchmark Matrix
| Escenario | Doctors | Periods | Days | Availability | Objetivo |
| --- | ---: | ---: | ---: | ---: | --- |
| `fixture-happy.basic` | 2 | 1 | 2 | 2 | Fixture happy compartido |
| `fixture-edge.one-doctor-multi-period` | 1 | 2 | 2 | 2 | Edge factible compartido |
| `fixture-edge.capacity-shortage` | 1 | 2 | 2 | 2 | Edge infactible por capacidad |
| `fixture-baseline.feasible` | 2 | 1 | 2 | 2 | Baseline factible legado |
| `fixture-baseline.infeasible` | 1 | 1 | 2 | 2 | Baseline infactible legado |
| `medium-dense-feasible` | 12 | 3 | 15 | 180 | Carga media densa |
| `large-dense-feasible` | 20 | 4 | 24 | 480 | Carga smoke alta |

## Baseline Metrics (ms)
| Escenario | min | p50 | p95 | avg | max |
| --- | ---: | ---: | ---: | ---: | ---: |
| `fixture-happy.basic` | 2.641 | 3.179 | 4.266 | 3.284 | 4.266 |
| `fixture-edge.one-doctor-multi-period` | 2.369 | 3.017 | 3.554 | 3.021 | 3.554 |
| `fixture-edge.capacity-shortage` | 2.389 | 2.618 | 2.950 | 2.649 | 2.950 |
| `fixture-baseline.feasible` | 2.444 | 2.647 | 2.987 | 2.682 | 2.987 |
| `fixture-baseline.infeasible` | 2.389 | 2.616 | 2.852 | 2.634 | 2.852 |
| `medium-dense-feasible` | 5.031 | 5.165 | 5.326 | 5.164 | 5.326 |
| `large-dense-feasible` | 9.287 | 10.001 | 11.470 | 10.126 | 11.470 |

## Hallazgos
- Todos los fixtures compartidos quedan por debajo de `p95=5ms`, con alta estabilidad.
- En escenarios densos, `medium` mantiene `p95=5.326ms` y `large` `p95=11.470ms`.
- La diferencia `medium` vs `large` es consistente con aumento de `|V|` y `|E|`; no se observan outliers extremos en esta corrida.

## Presupuestos y alarmas de regresion
- Tolerancia `warn`: `+20%` por encima del presupuesto.
- Clasificacion:
  - `go`: `p95 <= maxP95Ms`
  - `warn`: `maxP95Ms < p95 <= maxP95Ms * 1.20`
  - `no-go`: `p95 > maxP95Ms * 1.20`

| Escenario | maxP95Ms |
| --- | ---: |
| `fixture-happy.basic` | 8 |
| `fixture-edge.one-doctor-multi-period` | 8 |
| `fixture-edge.capacity-shortage` | 8 |
| `fixture-baseline.feasible` | 8 |
| `fixture-baseline.infeasible` | 8 |
| `medium-dense-feasible` | 12 |
| `large-dense-feasible` | 20 |
