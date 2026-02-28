# Engine Smoke Benchmark Baseline

Fecha de baseline: 2026-02-28

## Metodo
- Comando: `pnpm bench:engine-cpp`
- Binary under test: `services/engine-cpp/build/scheduler_engine`
- Corridas por escenario: 10
- Script: `scripts/benchmark-engine.mjs`
- Salida cruda: `docs/benchmarks/engine-smoke-baseline.json`

## Benchmark Matrix
| Escenario | Doctors | Periods | Days | Availability | Objetivo |
| --- | ---: | ---: | ---: | ---: | --- |
| `small-feasible-fixture` | 2 | 1 | 2 | 2 | Sanity factible minimo |
| `small-infeasible-fixture` | 1 | 1 | 2 | 2 | Sanity infactible minimo |
| `medium-dense-feasible` | 12 | 3 | 15 | 180 | Carga media densa |
| `large-dense-feasible` | 20 | 4 | 24 | 480 | Carga smoke alta |

## Baseline Metrics (ms)
| Escenario | min | p50 | p95 | avg | max |
| --- | ---: | ---: | ---: | ---: | ---: |
| `small-feasible-fixture` | 2.631 | 3.298 | 18.855 | 6.730 | 18.855 |
| `small-infeasible-fixture` | 2.421 | 2.677 | 34.040 | 6.817 | 34.040 |
| `medium-dense-feasible` | 4.945 | 5.191 | 31.542 | 10.400 | 31.542 |
| `large-dense-feasible` | 8.873 | 9.347 | 10.502 | 9.572 | 10.502 |

## Hallazgos
- La latencia tipica (p50) del smoke completo esta por debajo de 10 ms en todos los escenarios.
- Los picos de p95 en escenarios pequenos/medios son mayores que en el grande, lo que sugiere ruido de proceso/entorno (arranque de proceso y scheduler del SO) por encima del costo del algoritmo en esta escala.
- Con las cargas smoke actuales no se observa degradacion estructural por densidad (el escenario `large-dense-feasible` mantiene p95 cercano a p50).

## Presupuesto Inicial Recomendado (Smoke)
- `small-feasible-fixture`: p95 <= 25 ms
- `small-infeasible-fixture`: p95 <= 40 ms
- `medium-dense-feasible`: p95 <= 35 ms
- `large-dense-feasible`: p95 <= 20 ms

## Gate Propuesto
- `go` si todos los escenarios cumplen p95 dentro de presupuesto.
- `warn` si algun escenario excede presupuesto hasta 20%.
- `no-go` si algun escenario excede presupuesto por encima de 20%.
