# Modelo Formal de Red de Flujo

## Objetivo
Modelar la factibilidad de asignacion de medicos a dias respetando:
- capacidad total por medico (`C_i`),
- maximo un dia por periodo por medico,
- demanda diaria (`R_d`).

## Definiciones
- Medicos: `i in M`.
- Periodos: `k in P`.
- Dias del periodo `k`: `D_k`.
- Dias globales: `D = union_k D_k`.
- Disponibilidad: tuplas `(i, k, d)` validas.
- Capacidad total por medico: `C_i`.
- Demanda por dia: `R_d`.

## Construccion del grafo
Se construye un digrafo con nodos:
- `s` (source)
- un nodo por medico `m_i`
- un nodo por par medico-periodo `mp_{i,k}`
- un nodo por dia `d`
- `t` (sink)

Aristas y capacidades:
1. `s -> m_i` con capacidad `C_i`
2. `m_i -> mp_{i,k}` con capacidad `1`
3. `mp_{i,k} -> d` con capacidad `1` solo si `(i,k,d)` esta disponible y `d in D_k`
4. `d -> t` con capacidad `R_d`

## Interpretacion de flujo
- Una unidad de flujo representa asignar 1 medico a 1 dia.
- Flujo por `m_i` limita dias totales del medico.
- Flujo por `m_i -> mp_{i,k}` limita a 1 dia por medico en cada periodo.
- Flujo por `d -> t` limita/cubre demanda diaria.

## Criterio de factibilidad
Sea `R = sum_{d in D} R_d`.
- Instancia factible si `maxFlow(s,t) = R`.
- Instancia infactible si `maxFlow(s,t) < R`.

## Salida de asignaciones
Las asignaciones se extraen de aristas `mp_{i,k} -> d` con flujo `1`.
Cada arista con flujo positivo se mapea a:
- `doctorId = i`
- `periodId = k`
- `dayId = d`

## Corte minimo
Sobre la residual final:
- `S`: nodos alcanzables desde `s`
- `T`: resto de nodos

El valor del corte minimo coincide con `maxFlow`.
Las aristas de corte `S -> T` ayudan a diagnosticar cuellos de botella de instancias infactibles.

## Revision formal de implementacion (2026-03-01)
Codigo auditado:
- `services/engine-cpp/src/graph_builder.cpp`
- `services/engine-cpp/src/solver.cpp`
- `services/engine-cpp/src/assignment_extractor.cpp`

### Mapeo de restricciones -> capacidades
1. Limite total por medico (`C_i`)
- Implementado en aristas `s -> m_i` con capacidad `max(0, C_i)`.

2. Maximo un dia por medico en cada periodo
- Implementado en aristas `m_i -> mp_{i,k}` con capacidad `1`.

3. Disponibilidad y consistencia periodo-dia
- Solo se crea `mp_{i,k} -> d` si existe disponibilidad `(i,k,d)` y `d` pertenece al periodo `k`.
- Cada arista de asignacion tiene capacidad `1`.

4. Cobertura de demanda diaria (`R_d`)
- Implementado en aristas `d -> t` con capacidad `max(0, R_d)`.

### Criterio de factibilidad implementado
- `total_demand = sum_d max(0, R_d)`.
- `is_feasible := (maxFlow == total_demand)`.
- Coincide con la definicion formal de factibilidad.

### Esbozo de correccion
1. Soundness (flujo -> asignacion valida)
- Si una arista `mp_{i,k} -> d` tiene flujo positivo, se extrae una asignacion `(i,k,d)`.
- Capacidades garantizan:
  - no superar `C_i`,
  - no mas de 1 dia por medico/periodo,
  - no asignar fuera de disponibilidad,
  - no exceder demanda diaria.

2. Completeness (asignacion valida -> flujo)
- Dada una asignacion valida, se enruta 1 unidad por camino `s -> m_i -> mp_{i,k} -> d -> t`.
- Validez de la asignacion implica que ninguna capacidad se viola.
- Por lo tanto existe un flujo factible con valor igual a la cobertura de esa asignacion.

3. Integridad
- Todas las capacidades son enteras.
- Max-flow sobre esta red produce flujo entero.
- Luego la extraccion por flujo unitario representa decisiones discretas de asignacion.

### Complejidad
Sea:
- `|M|`: medicos
- `|P|`: periodos
- `|D|`: dias con demanda
- `|A|`: disponibilidades validas

Nodos:
- `V = 2 + |M| + |M||P| + |D|`

Aristas:
- `E = |M| + |M||P| + |A| + |D|`

Con Edmonds-Karp:
- Tiempo `O(V * E^2)`.
- Memoria `O(V + E)`.

### Supuestos de frontera
- El contrato compartido (`packages/domain`) valida unicidad y consistencia semantica antes de engine.
- Si el input llega sin validacion (invocacion directa del binario), el parser C++ acepta estructura JSON minima y la red aplica reglas por capacidad; por eso la validacion de contrato en API/cliente sigue siendo obligatoria.
