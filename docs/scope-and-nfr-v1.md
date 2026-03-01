# Scope and NFR v1 (MVP)

- Status: accepted
- Date: 2026-03-01

## Goal
Definir alcance cerrado del MVP de planificacion de guardias con solver max-flow, API operativa y frontend para uso interno de planificador/medico.

## Functional scope (in)
- Gestion de catalogos base en API:
  - medicos (CRUD)
  - periodos y demandas diarias (CRUD + replace demands)
- Gestion de sprint:
  - crear sprint con configuracion global (`requiredDoctorsPerShift`, `maxDaysPerDoctorDefault`)
  - asociar medicos al sprint
  - cargar disponibilidad por medico (self-service)
  - override de disponibilidad por planificador
- Validacion operativa:
  - marcar sprint `ready-to-solve`
  - ejecutar corrida por sprint
  - consultar historial de corridas por sprint
- Trazabilidad:
  - snapshot de input/output por corrida
  - fuente de disponibilidad (`doctor-self-service` o `planner-override`)
- Observabilidad y contrato:
  - OpenAPI (`/openapi.json`) y Swagger UI (`/docs`)

## Functional scope (out)
- Autenticacion completa con login/password en backend.
- Integracion con IdP corporativo real (OIDC/SAML) en MVP.
- Optimizacion multiobjetivo avanzada (preferencias/soft constraints complejas).
- Planificacion multi-sprint automatica.
- Notificaciones, calendario externo o integraciones de RRHH.

## Users and responsibilities
- `planner`:
  - administra catalogos
  - crea/configura sprints
  - aplica override
  - marca ready y ejecuta corridas
- `doctor`:
  - carga su propia disponibilidad para sprints donde participa

## Non-functional requirements (minimum)
- Security baseline:
  - JWT bearer en endpoints protegidos
  - control de rol (`doctor`/`planner`) en API
  - hardening base (rate-limit, body limit, error sanitization)
- Data integrity:
  - validaciones Zod en contratos compartidos
  - persistencia SQLite via Prisma para estado operativo
- Traceability:
  - requestId y logging estructurado
  - corridas consultables con snapshots
- Performance baseline:
  - benchmark smoke de engine publicado
  - budgets de regresion definidos
- Operability:
  - despliegue dockerizable (web/api/engine)
  - runbook y rollback documentados

## MVP done criteria
- Flujo completo operativo:
  1. crear/catalogar datos
  2. configurar sprint
  3. cargar disponibilidad
  4. marcar ready
  5. correr solver
  6. revisar historial/resultados
- Sin backlog tecnico bloqueante en E1-E6 del tablero.
- Documentacion de arquitectura y consistencia publicada (ver `docs/adr-002-architecture-v1.md` y `docs/model-consistency-v1.md`).

## Risks and limits
- Sin IdP real, el esquema de token dev no cubre todas las necesidades de seguridad productiva.
- SQLite es suficiente para MVP, pero puede requerir migracion a DB server en escala.
