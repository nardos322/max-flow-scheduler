#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[reset:local] Resetting API local database..."
rm -f apps/api/.data/dev.db apps/api/.data/dev.db-journal
rm -f apps/api/.data/test-prisma.db apps/api/.data/test-prisma.db-journal

echo "[reset:local] Re-running setup..."
bash scripts/setup-local.sh
