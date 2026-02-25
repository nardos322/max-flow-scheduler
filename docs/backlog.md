# Backlog Inicial (Epicas e Historias)

## EPIC 1 - Plataforma Monorepo
### US-001 Configurar workspace
- Como developer quiero un monorepo consistente para trabajar en API, web y motor sin friccion.
- Criterios:
  - Estructura de carpetas base creada.
  - Scripts raiz para `dev`, `build`, `lint`, `test`.
  - Documentacion de arranque local.
  - Setup inicial de Tailwind en `apps/web`.

### US-002 Pipeline CI base
- Como equipo quiero validar calidad automaticamente en cada PR.
- Criterios:
  - Job de lint.
  - Job de typecheck.
  - Job de test.

## EPIC 2 - Modelo de dominio
### US-010 Definir contratos de entrada/salida
- Como backend/frontend quiero contratos compartidos para evitar drift.
- Criterios:
  - Schemas Zod compartidos en package comun.
  - Version inicial de DTOs para solver request/response.

### US-011 Validar reglas del problema
- Como usuario quiero feedback temprano cuando un input es invalido.
- Criterios:
  - Validaciones de IDs unicos, periodos validos, disponibilidad coherente.
  - Mensajes de error legibles por campo.

## EPIC 3 - Motor C++ Max-Flow
### US-020 Implementar constructor de red
- Como motor quiero transformar el input en una red de flujo correcta.
- Criterios:
  - Nodos: source, doctor, doctor-period, day, sink.
  - Capacidades: `C_i`, `1`, `1`, `R_d`.

### US-021 Implementar Edmonds-Karp
- Como sistema quiero resolver factibilidad de asignacion.
- Criterios:
  - Retorna flujo maximo y caminos augmenting validos.
  - Complejidad documentada.

### US-022 Exportar asignacion util
- Como API quiero recibir asignaciones por dia y diagnosticos.
- Criterios:
  - Respuesta JSON estable.
  - Incluye `isFeasible`, `assignedCount`, `uncoveredDays`.

### US-023 Calcular corte minimo
- Como operador quiero entender el cuello de botella de una instancia infactible.
- Criterios:
  - Devuelve `minCutValue` y particion alcanzable/no alcanzable (`S/T`) desde source en la residual final.
  - Lista aristas de corte relevantes (`cutEdges`) para diagnostico.
  - Se valida en tests que `maxFlow == minCutValue` en casos de referencia.

## EPIC 4 - API Node/Express
### US-030 Endpoint resolver planificacion
- Como cliente quiero enviar el escenario y recibir un plan.
- Criterios:
  - `POST /schedule/solve` implementado.
  - Validacion Zod de request/response.
  - Soporte de bloque `minCut` opcional en la respuesta.

### US-031 Manejo de errores y observabilidad
- Como operador quiero entender fallas rapidamente.
- Criterios:
  - Errores normalizados (`400`, `422`, `500`).
  - Logging estructurado con `requestId`.

## EPIC 5 - Frontend React
### US-040 Crear formulario de escenario
- Como planner quiero cargar medicos, periodos y disponibilidad.
- Criterios:
  - CRUD local en UI para entidades base.
  - Estado local de formulario con `Zustand`.
  - Validacion previa con Zod.

### US-041 Configurar demanda diaria
- Como planner quiero definir cuantos medicos se requieren por dia.
- Criterios:
  - Campo `requiredDoctors` por dia.
  - UI bloquea valores invalidos.

### US-042 Visualizar solucion
- Como planner quiero interpretar resultado facilmente.
- Criterios:
  - Tabla/calendario de asignaciones.
  - Alertas claras para dias no cubiertos.
  - Panel de diagnostico de `minCut` cuando el backend lo entregue.
  - Uso de componentes UI reutilizables + iconografia consistente.

### US-043 Orquestar estado de requests
- Como frontend quiero manejar llamadas al backend de forma robusta y predecible.
- Criterios:
  - `TanStack Query` configurado para mutaciones de `solve`.
  - Manejo explicito de estados `loading`, `error` y `success`.
  - Capa de cliente aislada para evolucionar retries/caching sin tocar vistas.

## EPIC 6 - Calidad
### US-050 Tests del motor
- Como equipo quiero evitar regresiones del algoritmo.
- Criterios:
  - Unit tests y fixtures de regresion.
  - Casos edge: sin disponibilidad, limites de capacidad, periodos solapados.
  - Validacion de propiedad max-flow/min-cut en fixtures seleccionados.

### US-051 Tests API integrados
- Como equipo quiero confianza end-to-end API + C++.
- Criterios:
  - Tests de integracion con motor real.
  - Contratos validados con snapshots controlados.

### US-052 E2E web
- Como negocio quiero asegurar que el flujo principal funciona.
- Criterios:
  - Crear escenario -> resolver -> visualizar resultado en test automatizado.

## Orden recomendado de ejecucion
1. EPIC 1
2. EPIC 2
3. EPIC 3
4. EPIC 4
5. EPIC 5
6. EPIC 6
