# Contributing

## Requisitos
- Node 22+
- pnpm 10+
- CMake 3.20+
- Compilador C++17

## Flujo
1. Crear rama por feature.
2. Implementar cambios con tests.
3. Ejecutar `pnpm ci` antes de abrir PR.

## Convenciones
- TypeScript en modo estricto.
- Validaciones de entrada con Zod.
- No romper contratos compartidos sin versionar cambios.
