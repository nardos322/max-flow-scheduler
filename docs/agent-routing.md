# Agent Routing Playbook

## Objetivo
Estandarizar como se enruta cada pedido a subagentes para ejecutar rapido, con dueños claros y sin duplicar trabajo.

## Regla principal
- Cada tarea tiene 1 subagente primario (owner).
- Puede tener 0-2 subagentes secundarios.
- Cambios de codigo se cierran con verificacion de `qa-reliability`.

## Matriz de enrutamiento
| Tipo de pedido | Primario | Secundario(s) | Entregable esperado |
|---|---|---|---|
| Bootstrap de repo/monorepo | `repo-bootstrap` | `devops-release` | Estructura, scripts base, CI inicial |
| Roadmap, epicas, planning | `planner-architect` | `technical-writer` | Plan por sprint + backlog con DoD |
| Modelo matematico y correccion | `modeling-theory` | `planner-architect` | Modelo formal + prueba + complejidad |
| Implementar/refactor solver C++ | `cpp-engine` | `qa-reliability` | Solver + tests unitarios/regresion |
| Definir contratos API/Zod | `api-contracts` | `integration-orchestrator` | Schemas, errores, compatibilidad |
| Implementar endpoint/adapter API->Engine | `api-contracts` | `integration-orchestrator`, `qa-reliability` | Endpoint estable + tests integracion |
| UI de planificacion (React/Vite) | `frontend-planner-ui` | `api-contracts`, `qa-reliability` | Pantallas + validaciones + tests |
| Coordinar cambios cross-module | `integration-orchestrator` | `api-contracts`, `cpp-engine` | Reporte de drift + plan de integracion |
| Fixtures y data de prueba | `data-fixtures` | `qa-reliability` | Catalogo de fixtures + expected outputs |
| Rendimiento/latencia | `performance-benchmarks` | `cpp-engine`, `devops-release` | Baseline, cuellos de botella, budgets |
| Hardening y seguridad | `security-compliance` | `devops-release`, `api-contracts` | Checklist seguridad + remediaciones |
| CI/CD, release, rollback | `devops-release` | `qa-reliability`, `technical-writer` | Pipeline, runbook, estrategia rollback |
| ADRs/runbooks/documentacion | `technical-writer` | `planner-architect` | Documento tecnico actualizado |

## Reglas de escalamiento
- Si afecta contratos entre 2+ modulos: incluir `integration-orchestrator`.
- Si afecta release o operacion: incluir `devops-release`.
- Si afecta calidad o riesgo de regresion: incluir `qa-reliability`.
- Si cambia reglas del modelo: incluir `modeling-theory`.

## Flujo operativo recomendado
1. Clasificar pedido.
2. Asignar primario y secundarios (segun tabla).
3. Ejecutar implementacion por primario.
4. Correr verificacion cruzada (integracion/calidad).
5. Entregar con evidencia: pruebas, riesgos, siguientes pasos.

## Plantillas de pedido
### Plantilla corta
"Usa `<subagente>` para `<tarea>`. Entregable: `<resultado esperado>`."

### Plantilla completa
"Usa `<primario>` con apoyo de `<secundario1>`, `<secundario2>` para `<tarea>`.\
Scope: `<in-scope>`; fuera: `<out-of-scope>`.\
Done cuando: `<criterios de cierre>`."

## Ejemplos
- "Usa `cpp-engine` con apoyo de `qa-reliability` para implementar Edmonds-Karp y agregar tests de regresion. Done cuando pase suite de motor y casos infactibles reporten diagnostico."
- "Usa `api-contracts` con apoyo de `integration-orchestrator` para definir `POST /schedule/solve` con Zod y mapa de errores 400/422/500."
- "Usa `frontend-planner-ui` con apoyo de `api-contracts` para construir formulario de demanda diaria y visualizar dias no cubiertos."
