# Fixture Outcomes (US-202)

## Source Of Truth
- Catalog: `packages/domain/fixtures/catalog.json`
- Request payloads: `packages/domain/fixtures/*.request.json`

## Taxonomy
- `happy`: escenarios factibles base.
- `edge`: escenarios límite (factibles o infactibles controlados).
- `invalid`: payloads que deben fallar validación de contrato.

## Expected Outcomes
- `expectSchemaValid`: define si el payload debe pasar `solveRequestSchema`.
- `expectedSolver` (solo para fixtures válidos):
  - `isFeasible`
  - `assignedCount`
  - `uncoveredDaysCount`

## Consumer Mapping
- Domain:
  - valida catálogo completo y consistencia de `expectedSolver`.
- API integration:
  - ejecuta todos los fixtures válidos contra engine y compara con `expectedSolver`.
  - valida que fixtures inválidos fallen con `400`.
- C++ engine:
  - recorre catálogo y valida resultados solver para fixtures válidos.

## Update Policy
1. Cualquier fixture nuevo debe agregarse en `catalog.json`.
2. Si `expectSchemaValid=true`, `expectedSolver` es obligatorio.
3. Si `expectSchemaValid=false`, `expectedSolver` no debe existir.
4. Cuando cambie el contrato, actualizar fixtures + catálogo en el mismo commit.
