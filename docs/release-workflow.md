# Release Workflow

## Objetivo
Publicar versiones estables del proyecto con trazabilidad clara entre etapa, cambios y artefactos.

## Versionado
- Usar SemVer: `MAJOR.MINOR.PATCH`.
- Recomendacion para este proyecto:
  - `0.x.y` mientras sea pre-1.0.
  - `MINOR` para features nuevas compatibles.
  - `PATCH` para fixes sin cambios de contrato.

## Cadencia sugerida
1. Cerrar conjunto de historias en `main`.
2. Ejecutar validacion completa (`pnpm run ci`).
3. Crear tag de release.
4. Publicar changelog.

## Proceso
1. Verificar que `main` este limpio y en verde.
2. Definir version (ejemplo: `v0.2.0`).
3. Crear tag anotado:
```bash
git tag -a v0.2.0 -m "release: v0.2.0"
git push origin v0.2.0
```
4. Registrar changelog con:
- features incluidas;
- fixes;
- cambios de contrato/API;
- notas de migracion (si aplica).

## Pipeline automatizado
- Workflow: `.github/workflows/release.yml`
- Trigger: push de tags `v*.*.*`
- Artefactos publicados en GHCR:
  - `ghcr.io/<owner>/<repo>-api:<version>`
  - `ghcr.io/<owner>/<repo>-engine:<version>`
  - actualizacion de alias `latest` para ambos.

## Rollback
- Workflow: `.github/workflows/rollback.yml`
- Trigger: `workflow_dispatch` con input `version` (ej: `v0.2.1`)
- Accion:
  - retaggea `ghcr` de API y engine desde `<version>` a `latest`.
- Uso:
  1. Ir a Actions -> `Rollback`.
  2. Ejecutar workflow con la version objetivo.
  3. Re-desplegar apuntando a `latest` o al tag fijo rollbackeado.

## Criterios de salida
- Todas las historias del milestone cerradas.
- CI en verde.
- Contratos sincronizados (`packages/domain`, API, web).
- Documentacion actualizada.

## Relacion con etapas
- Tags de etapa (`stage-X-done`) son internos de avance.
- Tags `vX.Y.Z` representan releases consumibles.
