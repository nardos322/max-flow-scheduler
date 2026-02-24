# Max Flow Scheduler

Monorepo para planificacion de medicos en vacaciones usando un solver de max-flow en C++.

## Stack
- API: Node.js + Express + TypeScript + Zod
- Frontend: React + Vite + TypeScript + Zod
- Engine: C++ + CMake + gtest
- Workspace: pnpm

## Estructura
- `apps/api`: API REST
- `apps/web`: interfaz de planificacion
- `packages/domain`: contratos y schemas compartidos
- `packages/engine-client`: wrapper TS para invocar el solver
- `services/engine-cpp`: motor de flujo maximo
- `infra`: infraestructura local/CI

## Comandos raiz
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:engine-cpp`

## Nota MVP
- Integracion API -> engine via CLI (`stdin/stdout`).
- Sin base de datos ni autenticacion en esta etapa.
