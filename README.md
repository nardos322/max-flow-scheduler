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

## Bootstrap de base de datos (API)
- Prisma schema: `apps/api/prisma/schema.prisma`
- Cliente Prisma: `apps/api/src/lib/prisma.ts`
- Scripts:
  - `pnpm --filter @scheduler/api run db:generate`
  - `pnpm --filter @scheduler/api run db:migrate -- --name init`
  - `pnpm --filter @scheduler/api run db:migrate:deploy`
  - `pnpm --filter @scheduler/api run db:studio`
- Ejemplo local de URL SQLite:
  - `DATABASE_URL="file:./dev.db"`

## Nota MVP
- Integracion API -> engine via CLI (`stdin/stdout`).
- Autenticacion JWT basica en endpoints de disponibilidad.
- Persistencia en transicion a Prisma + SQLite.
