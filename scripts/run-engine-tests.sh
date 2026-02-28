#!/usr/bin/env bash
set -euo pipefail

: "${SCHEDULER_FETCH_GTEST:=ON}"

cmake -S services/engine-cpp -B services/engine-cpp/build -DSCHEDULER_FETCH_GTEST="${SCHEDULER_FETCH_GTEST}"
cmake --build services/engine-cpp/build
ctest --test-dir services/engine-cpp/build --output-on-failure
