# Contract Versioning

## Objetivo
Evitar drift entre `packages/domain`, API y frontend cuando cambian request/response del solver.

## Alcance
- Schemas Zod.
- DTOs tipados compartidos.
- Payload entre API y motor C++.

## Reglas de compatibilidad
1. Cambio backward-compatible:
- agregar campos opcionales;
- agregar endpoints nuevos sin romper los existentes.

2. Cambio breaking:
- renombrar/eliminar campos;
- cambiar tipo de campo existente;
- cambiar semantica de validacion de forma incompatible.

## Politica
- Cambios compatibles: mantener misma version mayor.
- Cambios breaking: introducir version de contrato y plan de migracion.

## Estrategia recomendada
- Incluir `contractVersion` en request/response cuando empecemos a versionar formalmente.
- Mantener adaptadores temporales por una ventana de migracion.

## Checklist por PR de contrato
- `packages/domain` actualizado (schema + tipos).
- API actualizada y validando contra nuevo schema.
- Frontend actualizado al contrato vigente.
- Fixtures sincronizados.
- Tests de contrato en verde.
- Nota de migracion en changelog/docs si hay breaking change.

## Ejemplo de regla practica
- `minCut` agregado como opcional: compatible.
- `requiredDoctors` pasa de `number` a objeto complejo: potencialmente breaking.
