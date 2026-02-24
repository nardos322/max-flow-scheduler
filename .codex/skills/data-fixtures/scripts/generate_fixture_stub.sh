#!/usr/bin/env bash
set -euo pipefail

name="${1:-sample-fixture}"
mkdir -p fixtures
cat > "fixtures/${name}.json" <<JSON
{
  "name": "${name}",
  "doctors": [],
  "periods": [],
  "days": [],
  "expected": {}
}
JSON

echo "Created fixtures/${name}.json"
