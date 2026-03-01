# ADR-002: Architecture v1 for Max Flow Scheduler MVP

- Status: accepted
- Date: 2026-03-01

## Context
El proyecto ya implementa engine, API y frontend operativos con contratos compartidos. Faltaba formalizar una ADR de arquitectura v1 para cerrar US-101 con decisiones explicitadas y trazables.

## Decision
Adoptar arquitectura modular de monorepo con cuatro piezas principales:
- `services/engine-cpp`: solver max-flow (Edmonds-Karp) y extraccion de asignaciones.
- `packages/domain`: contrato de dominio compartido (Zod) entre API y frontend.
- `apps/api`: API Node/Express que valida contratos, persiste estado de sprint/runs con Prisma+SQLite, y orquesta ejecucion del engine.
- `apps/web`: frontend React/Vite para operacion de sprint (disponibilidad, ready-to-solve, corrida, historial).

Decisiones operativas asociadas:
- Persistencia MVP: `Prisma + SQLite`.
- Seguridad MVP: JWT bearer + RBAC (`planner`, `doctor`) + token dev controlado por entorno.
- Contratos y consumo manual: OpenAPI exportable (`apps/api/openapi.json`) + Swagger UI (`/docs`).
- Workflow: desarrollo por ramas feature + merge no-ff a `main`.

## Consequences
Pros:
- Limites claros por modulo y contratos centralizados.
- Menor drift entre frontend/API por uso de schemas compartidos.
- Persistencia real con baja friccion operativa para MVP.
- Trazabilidad de corridas para auditoria funcional.

Cons:
- SQLite puede limitar concurrencia/escala en escenarios mayores.
- Sin IdP real no hay SSO ni ciclo completo de identidad empresarial.
- Integracion engine como binario local requiere disciplina de empaquetado/runtime en despliegue.

## Alternatives considered
- Backend sin DB (in-memory/json):
  - descartado por falta de trazabilidad/durabilidad operativa.
- Backend con Postgres desde MVP:
  - valido, pero mayor costo operativo inicial; se priorizo velocidad de entrega.
- Auth full-stack propia (login/password) antes del MVP:
  - descartado por scope; se priorizo JWT dev + RBAC minimo.

## References
- Scope/NFR: `docs/scope-and-nfr-v1.md`
- Modelo formal: `docs/flow-network-model.md`
- Consistencia modelo-implementacion: `docs/model-consistency-v1.md`
- OpenAPI export: `apps/api/openapi.json`
- Release ADR previa: `docs/adr-001-release-operations.md`
