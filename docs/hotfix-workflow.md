# Hotfix Workflow

## Objetivo
Resolver incidentes criticos en produccion o bloqueos de desarrollo con tiempo de respuesta corto y bajo riesgo.

## Cuándo usar hotfix
- Error que rompe flujo principal.
- Bug de contrato que impide integrar API/frontend.
- Defecto de seguridad o corrupcion de datos.

## Flujo
1. Crear rama desde `main`:
```bash
git checkout main
git pull
git checkout -b hotfix/descripcion-corta
```
2. Implementar fix minimo necesario.
3. Agregar/ajustar test de regresion.
4. Ejecutar validacion minima:
- `pnpm run ci` (siempre que sea posible).
5. Abrir PR con etiqueta `hotfix`.
6. Merge por `squash` a `main`.
7. Crear tag patch (ejemplo `v0.2.1`).

## Reglas
- No mezclar features con hotfix.
- Mantener alcance acotado.
- Incluir causa raiz y accion preventiva en la descripcion del PR.

## Plantilla minima de PR hotfix
- Incidente:
- Impacto:
- Causa raiz:
- Solucion aplicada:
- Test de regresion:
- Riesgos remanentes:
