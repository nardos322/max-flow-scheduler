# Git Workflow

## Objetivo
Mantener `main` estable mientras avanzamos por etapas, historias y trabajo con subagentes.

## Reglas base
1. `main` solo recibe cambios via PR.
2. Cada PR debe estar en verde con `pnpm run ci`.
3. No se crean ramas por subagente; se crea una rama por historia/tarea.

## Estrategia de ramas
- Una rama por historia o tarea concreta.
- Naming recomendado:
  - `feat/us-XXX-nombre-corto`
  - `fix/us-XXX-nombre-corto`
  - `chore/stage-X-nombre-corto`
- Ejemplos:
  - `feat/us-023-min-cut`
  - `feat/us-040-scheduler-form`
  - `chore/stage-2-contracts`

## Flujo operativo con subagentes
1. Definir historia/tarea a implementar.
2. Crear/usar rama de esa historia.
3. Delegar subtareas a subagentes dentro de la misma rama.
4. Integrar y validar resultados en esa rama.
5. Abrir PR.

## Regla de integracion
- Los subagentes no deben abrir ramas nuevas automaticamente.
- Si hay trabajo en paralelo real, se usa una sub-rama acordada explicitamente y luego se integra en la rama de historia.

## Politica de PR
- Un PR = una historia/tarea principal.
- PR pequeno y trazable.
- Checklist minimo:
  - tests agregados/actualizados;
  - docs/contratos actualizados si aplica;
  - `pnpm run ci` en verde.

## Merge
- Preferir `squash merge` a `main` para mantener historial claro.
- El titulo del PR debe representar la historia (`US-XXX`).

## Hitos por etapa
Al cerrar cada etapa, crear tag de version interna:
- `stage-1-done`
- `stage-2-done`
- `stage-3-done`

Comando ejemplo:
```bash
git tag stage-2-done
git push origin stage-2-done
```

## Convencion de commits
- Formato sugerido:
  - `feat(us-023): add min-cut output`
  - `fix(us-030): map engine errors to 422`
  - `chore(stage-2): align contracts and fixtures`
