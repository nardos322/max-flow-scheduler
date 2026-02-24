# Max Flow Scheduler - Roadmap de Implementacion

## Objetivo
Construir un monorepo con:
- Motor de asignacion en C++ basado en max-flow.
- API en Node.js + Express + TypeScript.
- Frontend en React + Vite + TypeScript.
- Validaciones compartidas con Zod.
- Pipeline de calidad con pruebas automatizadas de extremo a extremo.

## Arquitectura objetivo
- `apps/api`: API REST, orquesta validaciones, ejecuta motor C++, expone resultados.
- `apps/web`: UI para cargar disponibilidad, demanda diaria y visualizar asignaciones.
- `packages/domain`: contratos de dominio, tipos y esquemas Zod compartidos.
- `packages/engine-client`: wrapper TS para invocar el binario C++.
- `services/engine-cpp`: implementacion del algoritmo de flujo maximo y parser IO.
- `infra`: docker compose, scripts CI, configuraciones de pipeline.

## Sprint 0 - Foundation (1 semana)
### Objetivo
Dejar el monorepo listo para desarrollo paralelo.

### Entregables
- Workspace monorepo (pnpm o npm workspaces + CMake para C++).
- Linting/format (`eslint`, `prettier`, reglas TS estrictas).
- Base de testing (`vitest` para TS, `gtest` o `catch2` para C++).
- CI inicial: lint + typecheck + tests.
- Convenciones (`CONTRIBUTING.md`, `CODEOWNERS` opcional).

### DoD
- `pnpm lint`, `pnpm test`, `pnpm typecheck` corren en limpio en local y CI.

## Sprint 1 - Dominio y contratos (1 semana)
### Objetivo
Fijar el modelo de entrada/salida y reglas de negocio.

### Entregables
- Modelo formal de red de flujo para el problema.
- Esquemas Zod compartidos en `packages/domain`.
- Contrato API inicial (`POST /schedule/solve`).
- Fixtures JSON de casos factibles e infactibles.

### DoD
- Contratos versionados y cubiertos por tests de validacion.

## Sprint 2 - Motor C++ (1-2 semanas)
### Objetivo
Implementar solucionador robusto y testeado.

### Entregables
- Implementacion Edmonds-Karp.
- Constructor de grafo desde payload.
- Mapeo de resultado a asignaciones por dia.
- Binario CLI con IO JSON (`stdin`/`stdout`).
- Pruebas unitarias y de regresion.

### DoD
- Casos base pasan.
- Casos infactibles retornan diagnostico legible.
- Cobertura minima objetivo en modulo core >= 85%.

## Sprint 3 - API y orquestacion (1 semana)
### Objetivo
Exponer el motor como servicio estable.

### Entregables
- Endpoint `POST /schedule/solve` con validaciones Zod.
- Integracion con `engine-client`.
- Mapeo de errores de motor a respuestas HTTP consistentes.
- Logging estructurado y request-id.
- Tests de integracion API + motor.

### DoD
- API responde con contratos estables ante inputs validos e invalidos.

## Sprint 4 - Frontend planificador (1-2 semanas)
### Objetivo
Permitir planificar sprints con visualizacion de cobertura diaria.

### Entregables
- Formularios de medicos, periodos y disponibilidad.
- Configuracion de demanda diaria (`medicos requeridos por dia`).
- Vista de resultado: asignaciones por dia y alertas de no factibilidad.
- Tests de componentes y flujo principal.

### DoD
- Usuario puede cargar un caso completo y obtener un resultado interpretable.

## Sprint 5 - Hardening y release (1 semana)
### Objetivo
Cerrar riesgos de operacion y rendimiento.

### Entregables
- E2E (Playwright) del flujo principal.
- Benchmarks de rendimiento del motor.
- Imagenes Docker para API/Web/Engine.
- Documentacion operativa de deploy y troubleshooting.

### DoD
- Pipeline verde con gates de calidad.
- Version candidata desplegable.

## Riesgos clave
- Integracion API <-> C++ por formato IO (mitigar con contratos y fixtures comunes).
- Complejidad de datos reales (mitigar con validaciones Zod estrictas y errores explicitos).
- Tiempo de ejecucion en instancias grandes (mitigar con benchmarks tempranos).
