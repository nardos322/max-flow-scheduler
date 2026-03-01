# Tablero de Ejecucion (9 semanas)

_Ultima actualizacion manual: 2026-03-01 (alineado con evidencia en codigo/repositorio)._

## Convenciones
- Estados: `todo`, `in-progress`, `blocked`, `done`
- Prioridad: `P0` (critico), `P1` (alta), `P2` (media)
- Estimacion: puntos relativos (1,2,3,5,8)

## Decision operativa (2026-03-01)
- Estrategia vigente: `backend-first` estricto.
- Regla de ejecucion: no iniciar nuevas tareas de frontend hasta cerrar backlog backend pendiente.
- Decisión de arquitectura de datos: migrar persistencia backend de `in-memory/json` a `Prisma + SQLite` antes de nuevas historias funcionales de sprint.
- Tareas frontend que quedan en espera por esta decision: `T-502.1`, `T-502.2`, `T-502.3`, `T-552.1`, `T-552.2`, `T-553.3`.

### Cola activa backend-only
1. `T-601.2` Secret scanning y politica de secretos.
2. `T-602.1` Ejecutar benchmark matrix final.
3. `T-602.2` Definir budgets y alarmas de regresion.
4. `T-603.1` Dockerizar API/engine.
5. `T-603.2` Pipeline de release + rollback.
6. `T-603.3` Runbook/ADR/changelog tecnico.

## EPIC E1 - Foundation Monorepo (Semanas 1-2)
### US-101 Definir arquitectura y alcance (P0, 5)
- T-101.1 Documentar alcance funcional y no-funcional. Owner: `planner-architect`. Estado: `todo`
- T-101.2 Publicar ADR v1 de arquitectura. Owner: `planner-architect`. Estado: `todo`
- T-101.3 Revisar consistencia con modelo matematico. Owner: `modeling-theory`. Estado: `todo`
- Done cuando:
  - ADR aprobado
  - Alcance cerrado
  - Riesgos principales documentados

### US-102 Bootstrap monorepo (P0, 8)
- T-102.1 Crear estructura `apps/`, `packages/`, `services/`, `infra/`. Owner: `repo-bootstrap`. Estado: `done`
- T-102.2 Configurar workspace package manager. Owner: `repo-bootstrap`. Estado: `done`
- T-102.3 Configurar TS strict, ESLint, Prettier. Owner: `repo-bootstrap`. Estado: `done`
- T-102.4 Configurar CMake/CTest base. Owner: `repo-bootstrap`. Estado: `done`
- Done cuando:
  - Comandos raiz existen (`lint`, `test`, `build`, `typecheck`)
  - Tooling corre local

### US-103 CI baseline (P0, 5)
- T-103.1 Pipeline lint/typecheck/test. Owner: `devops-release`. Estado: `done`
- T-103.2 Definir gates minimos. Owner: `qa-reliability`. Estado: `done`
- Done cuando:
  - CI verde en rama principal

### US-104 Persistencia backend con Prisma/SQLite (P0, 8)
- T-104.1 Introducir Prisma + SQLite en `apps/api` (schema, client, scripts). Owner: `repo-bootstrap`. Estado: `done`
- T-104.2 Modelar entidades de planificacion persistentes (`Sprint`, `SprintDoctor`, `SprintAvailability`, `SprintRun`). Owner: `api-contracts`. Estado: `done`
- T-104.3 Migrar repositorios de sprint/runs a Prisma sin romper contratos API. Owner: `integration-orchestrator`. Estado: `done`
- T-104.4 Adaptar tests backend a DB SQLite deterministica. Owner: `qa-reliability`. Estado: `done`
- Done cuando:
  - API de sprints ya no depende de store `in-memory/json`
  - Migraciones versionadas y ejecutables en CI/local
  - Suite backend verde con persistencia real

## EPIC E2 - Dominio y Contratos (Semana 3)
### US-201 Contratos Zod compartidos (P0, 8)
- T-201.1 Crear `packages/domain` con schemas request/response solver. Owner: `api-contracts`. Estado: `done`
- T-201.2 Versionar contrato v1. Owner: `api-contracts`. Estado: `done`
- T-201.3 Validar compatibilidad multi-modulo. Owner: `integration-orchestrator`. Estado: `done`
- Done cuando:
  - Contrato publicado y consumible por API/web

### US-202 Fixtures base (P1, 5)
- T-202.1 Crear fixtures happy/edge/invalid. Owner: `data-fixtures`. Estado: `done`
- T-202.2 Definir expected outcomes por fixture. Owner: `qa-reliability`. Estado: `done`
- Done cuando:
  - Fixtures usados en al menos 2 suites (engine y API)

## EPIC E3 - Solver C++ (Semanas 4-5)
### US-301 Implementar red de flujo (P0, 8)
- T-301.1 Mapear nodos/aristas/capacidades desde input. Owner: `cpp-engine`. Estado: `done`
- T-301.2 Validar restricciones (`C_i`, por periodo, disponibilidad, `R_d`). Owner: `cpp-engine`. Estado: `done`
- T-301.3 Revisar formalmente el modelo implementado. Owner: `modeling-theory`. Estado: `done`
- Done cuando:
  - Constructor de red cubierto por unit tests

### US-302 Edmonds-Karp + extraccion (P0, 8)
- T-302.1 Implementar algoritmo y residual graph. Owner: `cpp-engine`. Estado: `done`
- T-302.2 Extraer asignaciones por dia desde flujo. Owner: `cpp-engine`. Estado: `done`
- T-302.3 Exponer CLI JSON (stdin/stdout). Owner: `cpp-engine`. Estado: `done`
- Done cuando:
  - Salida JSON estable para escenarios factibles/infactibles

### US-303 Calidad motor (P0, 5)
- T-303.1 Unit tests + regresion + edge cases. Owner: `qa-reliability`. Estado: `done`
- T-303.2 Smoke benchmark inicial. Owner: `performance-benchmarks`. Estado: `done`
- Done cuando:
  - Suite motor en verde
  - Baseline de performance publicado

## EPIC E4 - API Integrada (Semana 6)
### US-401 Endpoint solve (P0, 8)
- T-401.1 Implementar `POST /schedule/solve`. Owner: `api-contracts`. Estado: `done`
- T-401.2 Validacion request/response con Zod. Owner: `api-contracts`. Estado: `done`
- T-401.3 Integrar invocacion de binario C++. Owner: `integration-orchestrator`. Estado: `done`
- Done cuando:
  - Endpoint responde contrato v1

### US-402 Errores y observabilidad (P1, 5)
- T-402.1 Mapa de errores 400/422/500. Owner: `api-contracts`. Estado: `done`
- T-402.2 Logging estructurado + requestId. Owner: `devops-release`. Estado: `done`
- T-402.3 Tests integracion API-engine. Owner: `qa-reliability`. Estado: `done`
- Done cuando:
  - Errores consistentes y trazables

## EPIC E5 - Frontend MVP (Semana 7)
### US-501 Editor de escenario (P0, 8)
- T-501.1 UI medicos, periodos, disponibilidad. Owner: `frontend-planner-ui`. Estado: `done`
- T-501.2 Campo de demanda diaria `requiredDoctors`. Owner: `frontend-planner-ui`. Estado: `done`
- T-501.3 Validacion con schemas compartidos. Owner: `frontend-planner-ui`. Estado: `done`
- Done cuando:
  - Formulario bloquea datos invalidos

### US-502 Resultado y no-factibilidad (P0, 5)
- T-502.1 Mostrar asignaciones por dia. Owner: `frontend-planner-ui`. Estado: `todo`
- T-502.2 Mostrar dias no cubiertos y mensajes claros. Owner: `frontend-planner-ui`. Estado: `todo`
- T-502.3 Test de flujo principal UI->API. Owner: `qa-reliability`. Estado: `todo`
- Done cuando:
  - Flujo end-to-end MVP operativo

## EPIC E5.5 - Operacion de Planificacion (Semanas 7-8)
### Estrategia de ejecucion
- Orden acordado: `backend-first`, luego `frontend`.
- Criterio: no arrancar UI de US-552/US-553 hasta cerrar contratos/API/tests de backend en E5.5.

### US-551 Sprint y reglas globales (P0, 8)
- T-551.1 Crear entidad `Sprint` y estado de planificacion. Owner: `planner-architect`. Estado: `done`
- T-551.2 Configurar reglas globales (`requiredDoctors`, maximo por medico). Owner: `api-contracts`. Estado: `done`
- T-551.3 Persistir configuracion de sprint en API. Owner: `integration-orchestrator`. Estado: `done`
- Done cuando:
  - Existe sprint planificable con configuracion global persistida

### US-552 Disponibilidad por medico y override planificador (P0, 8)
- T-552.1 Flujo de autogestion de disponibilidad por medico. Owner: `frontend-planner-ui`. Estado: `todo`
- T-552.2 Override manual por planificador cuando falte carga. Owner: `frontend-planner-ui`. Estado: `todo`
- T-552.3 Validar permisos/roles en API para carga de disponibilidad. Owner: `security-compliance`. Estado: `done`
- Done cuando:
  - Disponibilidad puede cargarse por medico o por planificador de forma trazable

### US-553 Ready-to-solve y trazabilidad de corridas (P0, 5)
- T-553.1 Validar estado `ready-to-solve` antes de ejecutar. Owner: `api-contracts`. Estado: `done`
- T-553.2 Guardar snapshot de input/output por corrida. Owner: `integration-orchestrator`. Estado: `done`
- T-553.3 Exponer historial de corridas por sprint. Owner: `frontend-planner-ui`. Estado: `todo`
- Done cuando:
  - Cada corrida queda registrada y consultable por sprint

## EPIC E6 - Hardening y Release (Semana 9)
### US-601 Seguridad baseline (P1, 5)
- T-601.1 Headers, rate-limit, body limits, sanitizacion de errores. Owner: `security-compliance`. Estado: `done`
- T-601.2 Secret scanning y politica de secretos. Owner: `security-compliance`. Estado: `todo`
- Done cuando:
  - Checklist seguridad aprobado

### US-602 Performance budgets (P1, 5)
- T-602.1 Ejecutar benchmark matrix final. Owner: `performance-benchmarks`. Estado: `todo`
- T-602.2 Definir budgets y alarmas de regresion. Owner: `performance-benchmarks`. Estado: `todo`
- Done cuando:
  - Baseline + thresholds documentados

### US-603 Release candidate (P0, 8)
- T-603.1 Dockerizar web/api/engine. Owner: `devops-release`. Estado: `todo`
- T-603.2 Pipeline de release + rollback. Owner: `devops-release`. Estado: `todo`
- T-603.3 Runbook/ADR/changelog tecnico. Owner: `technical-writer`. Estado: `todo`
- Done cuando:
  - RC desplegable y rollback probado

## Dependencias criticas
1. E1 -> E2 (sin foundation no hay contratos compartidos)
2. E2 -> E3/E4/E5 (contratos bloquean engine/api/web)
3. E3 -> E4 (API depende del solver)
4. E4 -> E5 (UI depende de endpoint estable)
5. E5 -> E5.5 (flujo MVP antes de operacion multiusuario)
6. E5.5 + E6 -> release final

## Cadencia recomendada
- Daily: actualizar estado de tareas y bloqueos.
- 2 veces por semana: revision de riesgos y drift de contratos.
- Fin de semana de sprint: demo + retro + ajuste de backlog.
