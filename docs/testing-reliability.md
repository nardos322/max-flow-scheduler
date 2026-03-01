# Testing Reliability Guide

## Objetivo
Mantener CI deterministico y detectar flakes temprano, con foco en pruebas criticas de frontend.

## Gates obligatorios
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:web:stability`

## Reglas anti-flake para tests async (UI)
- Esperar estados observables en UI (`findBy*`, `waitFor` sobre elementos/render), no timing implicito.
- Evitar asserts basados solo en cantidad de llamadas sin confirmar estado final de pantalla.
- Aislar `QueryClient` por test y desactivar retries para pruebas.
- Restablecer mocks globales (`vi.restoreAllMocks`) en cada caso.
- Usar mocks de `fetch` que contemplen todos los `refetch` esperados de mutaciones.

## Presupuestos web test stability
- Archivo: `docs/benchmarks/web-test-stability-budgets.json`
- Criterios:
  - `minRuns`: corridas minimas por check.
  - `maxFailedRuns`: fallas permitidas en el loop.
  - `maxP95Ms`: umbral de no-go para p95.
  - `warnAvgMs`: umbral de warning para promedio.

## Comandos
- Generar baseline:
  - `pnpm bench:web-tests`
- Ejecutar check de estabilidad:
  - `pnpm test:web:stability`
