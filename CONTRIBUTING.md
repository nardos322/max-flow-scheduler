# Contributing

## Requisitos
- Node 22+
- pnpm 10+
- CMake 3.20+
- Compilador C++17

## Flujo
1. Crear rama por historia/tarea (no por subagente).
2. Implementar cambios con tests.
3. Ejecutar `pnpm run ci` antes de abrir PR.
4. Abrir PR corto y enfocado (1 historia principal).
5. Merge con `squash` a `main`.

## Workflow Git
- Ver lineamientos completos en [docs/git-workflow.md](/home/nardos322/max-flow-scheduler/docs/git-workflow.md).

## Convenciones
- TypeScript en modo estricto.
- Validaciones de entrada con Zod.
- No romper contratos compartidos sin versionar cambios.
