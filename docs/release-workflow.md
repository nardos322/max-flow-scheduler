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

## Criterios de salida
- Todas las historias del milestone cerradas.
- CI en verde.
- Contratos sincronizados (`packages/domain`, API, web).
- Documentacion actualizada.

## Relacion con etapas
- Tags de etapa (`stage-X-done`) son internos de avance.
- Tags `vX.Y.Z` representan releases consumibles.
