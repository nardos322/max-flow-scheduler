#!/usr/bin/env bash
set -euo pipefail

cmake -S services/engine-cpp -B services/engine-cpp/build
cmake --build services/engine-cpp/build
ctest --test-dir services/engine-cpp/build --output-on-failure
