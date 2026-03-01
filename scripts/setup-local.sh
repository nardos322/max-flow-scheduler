#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[setup:local] Checking prerequisites..."
if ! command -v node >/dev/null 2>&1; then
  echo "[setup:local] Error: node is required."
  exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[setup:local] Error: pnpm is required."
  exit 1
fi

echo "[setup:local] Installing workspace dependencies..."
pnpm install --frozen-lockfile=false

if [[ ! -f apps/api/.env ]]; then
  echo "[setup:local] Creating apps/api/.env from development template..."
  cp apps/api/.env.development.example apps/api/.env
else
  echo "[setup:local] apps/api/.env already exists, keeping current values."
fi

echo "[setup:local] Preparing local database (Prisma migrate + generate)..."
pnpm --filter @scheduler/api run db:setup:local

echo "[setup:local] Seeding demo data..."
pnpm --filter @scheduler/api run db:seed:demo

cat <<'EOF'
[setup:local] Done.
Next step:
  pnpm dev
Optional:
  pnpm reset:local
EOF
