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

## Modelo backend actual
- Catalogo global de medicos (`/doctors`).
- Catalogo global de periodos (`/periods`) con demandas por dia (`/periods/:id/demands`).
- `Sprint` referencia `periodId` + `doctorIds` (subset de medicos del catalogo).
- Participantes del sprint editables en `draft` (`POST /sprints/:id/doctors`, `DELETE /sprints/:id/doctors/:doctorId`).
- Disponibilidad se registra por sprint/doctor/dia, y el planner puede override.

## Flujo oficial MVP (sprint-first)
- 1) Crear/configurar sprint: `POST /sprints`, `PATCH /sprints/:id/global-config`, `POST /sprints/:id/doctors`.
- 2) Cargar disponibilidad: `PUT /sprints/:id/doctors/:doctorId/availability` (medico) y/o `PUT /sprints/:id/availability/override` (planner).
- 3) Marcar listo para resolver: `PATCH /sprints/:id/status` con `ready-to-solve`.
- 4) Ejecutar corrida: `POST /sprints/:id/runs`.
- 5) Consultar historial: `GET /sprints/:id/runs`.
- `POST /schedule/solve` queda como endpoint tecnico transicional para compatibilidad.

## Comandos raiz
- `pnpm dev`
- `pnpm dev:api`
- `pnpm dev:web`
- `pnpm setup:local`
- `pnpm db:setup:local`
- `pnpm seed:demo`
- `pnpm reset:local`
- `pnpm docker:build`
- `pnpm docker:up`
- `pnpm docker:down`
- `pnpm docker:logs`
- `pnpm docker:ps`
- `pnpm docker:reset`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:engine-cpp`
- `pnpm test:web:stability`
- `pnpm bench:web-tests`

## Arranque local rapido (clone & run)
1. Instalar dependencias y bootstrap local:
   - `pnpm setup:local`
   - Este comando:
     - instala dependencias,
     - crea `apps/api/.env` desde `apps/api/.env.development.example` si no existe,
     - ejecuta migraciones Prisma en `apps/api/dev.db`,
     - carga seed demo (doctores, periodo, sprint listo y ciclo demo).
2. Levantar API + web:
   - `pnpm dev`
3. Resetear estado local cuando necesites empezar de cero:
   - `pnpm reset:local`

## Bootstrap de base de datos (API)
- Prisma schema: `apps/api/prisma/schema.prisma`
- Prisma config: `apps/api/prisma.config.ts`
- Cliente Prisma: `apps/api/src/lib/prisma.ts`
- Scripts:
  - `pnpm --filter @scheduler/api run db:generate`
  - `pnpm --filter @scheduler/api run db:migrate -- --name init`
  - `pnpm --filter @scheduler/api run db:migrate:deploy`
  - `pnpm --filter @scheduler/api run db:setup:local`
  - `pnpm --filter @scheduler/api run db:seed:demo`
  - `pnpm --filter @scheduler/api run db:reset:local`
  - `pnpm --filter @scheduler/api run db:studio`
  - `pnpm --filter @scheduler/api run test:prisma:sprint`
- Ejemplo local de URL SQLite:
  - `DATABASE_URL="file:./dev.db"`
  - Alternativa: copiar `apps/api/.env.example` a `apps/api/.env`

## Perfiles de auth (API)
- `dev` (MVP local):
  - `cp apps/api/.env.development.example apps/api/.env`
  - Usa `JWT_SECRET` (HS256) sin dependencia externa.
- `staging` (integracion con IdP):
  - `cp apps/api/.env.staging.example apps/api/.env`
  - Usa `JWT_JWKS_URL` (RS256/JWKS).
- `prod` (recomendado):
  - `cp apps/api/.env.production.example apps/api/.env`
  - Usa `JWT_JWKS_URL` y rotacion de claves del IdP.
- Prioridad de verificacion JWT en runtime:
  - `JWT_JWKS_URL` -> `JWT_PUBLIC_KEY` -> `JWT_SECRET`
- La API valida config de auth al arrancar (fail-fast) y corta startup si falta configuracion requerida.
- Bootstrap de token para desarrollo (opcional):
  - Habilitar `AUTH_DEV_TOKEN_ENABLED=true` (incluido en `.env.development.example`).
  - Endpoint: `POST /auth/dev/token` (publico, solo cuando el flag esta activo).
  - Requiere modo `shared-secret` (`JWT_SECRET`) y emite token HS256 con claims `sub`, `role`, `iss`, `aud`, `exp`.
  - Request:
    - `{ "userId": "planner-1", "role": "planner", "expiresInSeconds": 3600 }`
  - Uso rapido:
    - `curl -X POST http://localhost:3000/auth/dev/token -H "content-type: application/json" -d '{"userId":"doctor-7","role":"doctor"}'`

## Hardening API (MVP)
- Headers de seguridad por defecto en todas las respuestas.
- Rate limit in-memory configurable:
  - `API_RATE_LIMIT_WINDOW_MS` (default `60000`)
  - `API_RATE_LIMIT_MAX_REQUESTS` (default `120`)
- Limite de body JSON configurable:
  - `API_BODY_LIMIT` (default `100kb`)
- Autenticacion/autorizacion JWT en endpoints de negocio:
  - Claims obligatorios: `sub`, `role`, `iss`, `aud`, `exp` (y respeta `nbf` si existe)
  - Config requerida: `JWT_ISSUER`, `JWT_AUDIENCE` + uno de `JWT_JWKS_URL` (RS256/JWKS), `JWT_PUBLIC_KEY` (RS256) o `JWT_SECRET` (HS256)
- Sanitizacion de errores:
  - `413` para payload demasiado grande
  - `400` para JSON mal formado
  - `5xx` sin detalles internos del solver

## Swagger / OpenAPI (API)
- JSON OpenAPI: `GET /openapi.json`
- UI Swagger: `GET /docs`
- Artefacto versionado en repo: `apps/api/openapi.json`
- Export local del artefacto:
  - `pnpm --filter @scheduler/api run build` (incluye export)
  - o `pnpm --filter @scheduler/api run openapi:export:dev`
- Seguridad:
  - Endpoints de negocio documentados con `BearerAuth` (JWT).
  - `/health`, `/openapi.json` y `/docs` son publicos.
  - En `dev`, tambien puede estar publico `POST /auth/dev/token` si `AUTH_DEV_TOKEN_ENABLED=true`.

## Docker (API + Engine + Web)
- API Dockerfile: `apps/api/Dockerfile`
- Engine Dockerfile: `services/engine-cpp/Dockerfile`
- Web Dockerfile: `apps/web/Dockerfile`
- Compose local: `infra/docker-compose.yml`
- Comandos:
  - `pnpm docker:build`
  - `pnpm docker:up`
  - `pnpm docker:logs`
  - `pnpm docker:down`
  - `pnpm docker:reset`
- URLs por defecto:
  - Web: `http://localhost:5173`
  - API: `http://localhost:3000`
  - Swagger: `http://localhost:3000/docs`
- Nota:
  - `pnpm docker:reset` elimina volúmenes (`api-data`) para dejar estado limpio.

## Nota MVP
- Integracion API -> engine via CLI (`stdin/stdout`).
- Autenticacion JWT aplicada a endpoints de negocio; `/health` permanece publico.
- Persistencia backend de catalogos (medicos/periodos) + sprints/corridas sobre Prisma + SQLite.
