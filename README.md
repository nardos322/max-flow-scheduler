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
- Prisma config: `apps/api/prisma.config.ts`
- Cliente Prisma: `apps/api/src/lib/prisma.ts`
- Scripts:
  - `pnpm --filter @scheduler/api run db:generate`
  - `pnpm --filter @scheduler/api run db:migrate -- --name init`
  - `pnpm --filter @scheduler/api run db:migrate:deploy`
  - `pnpm --filter @scheduler/api run db:studio`
  - `pnpm --filter @scheduler/api run test:prisma:sprint`
- Ejemplo local de URL SQLite:
  - `DATABASE_URL="file:./dev.db"`
  - Alternativa: copiar `apps/api/.env.example` a `apps/api/.env`

## Hardening API (MVP)
- Headers de seguridad por defecto en todas las respuestas.
- Rate limit in-memory configurable:
  - `API_RATE_LIMIT_WINDOW_MS` (default `60000`)
  - `API_RATE_LIMIT_MAX_REQUESTS` (default `120`)
- Limite de body JSON configurable:
  - `API_BODY_LIMIT` (default `100kb`)
- Sanitizacion de errores:
  - `413` para payload demasiado grande
  - `400` para JSON mal formado
  - `5xx` sin detalles internos del solver

## Nota MVP
- Integracion API -> engine via CLI (`stdin/stdout`).
- Autenticacion JWT basica en endpoints de disponibilidad.
- Persistencia backend de sprints/corridas sobre Prisma + SQLite.
