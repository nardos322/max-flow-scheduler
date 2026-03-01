# Model Consistency v1 (Theory -> Implementation)

- Status: accepted
- Date: 2026-03-01

## Objective
Dejar evidencia de consistencia entre:
- modelo formal de flujo (max-flow/min-cut),
- contratos de dominio,
- comportamiento operativo API/frontend del MVP.

## Mapping: model to system
1. Restricciones del modelo
- Capacidad total por medico (`C_i`)
- Maximo 1 dia por medico/periodo
- Demanda diaria (`R_d`)
- Disponibilidad explicita `(doctor, period, day)`

2. Implementacion engine
- Construccion de red y capacidades: `services/engine-cpp/src/graph_builder.cpp`
- Resolucion max-flow: `services/engine-cpp/src/solver.cpp`
- Extraccion de asignaciones: `services/engine-cpp/src/assignment_extractor.cpp`
- Criterio de factibilidad: `maxFlow == totalDemand`

3. Contrato y validaciones
- Contratos compartidos: `packages/domain/src/index.ts`
- Validaciones semanticas clave:
  - unicidad de ids
  - consistencia periodo-dia
  - referencias validas en disponibilidad
  - estructura estable request/response

4. API operativa
- Endpoints de sprint y corrida en `apps/api/src/routes/sprint/*`
- Gate de negocio: `ready-to-solve` antes de correr
- Persistencia de snapshots de input/output por run

5. Frontend operativo
- Flujo guiado implementado:
  - cargar sprint
  - cargar disponibilidad
  - marcar `ready-to-solve`
  - ejecutar corrida
  - ver historial/resultados

## Invariants verified in MVP
- Nunca se ejecuta corrida de sprint fuera de estado permitido.
- Disponibilidad fuera de rango de periodo se rechaza.
- Resultado de solver respeta contrato versionado.
- Historial de corridas mantiene trazabilidad por sprint.

## Evidence
- Documento formal y revision teorica: `docs/flow-network-model.md`
- Contract versioning: `docs/contract-versioning.md`
- Expected outcomes por fixtures: `docs/fixture-outcomes.md`
- OpenAPI estable para QA/manual: `apps/api/openapi.json`

## Residual risks
- El MVP no implementa IdP real ni politicas enterprise de identidad.
- Diagnostico avanzado de infactibilidad (explicaciones de negocio) puede requerir mejoras adicionales sobre min-cut.
- Escala alta puede requerir evolucion de SQLite a DB server.

## Conclusion
La implementacion actual es consistente con el modelo matematico definido para el MVP, y la cadena teoria -> contrato -> API -> UI queda trazable con evidencia en codigo, tests y documentacion.
