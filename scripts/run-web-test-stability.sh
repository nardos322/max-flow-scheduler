#!/usr/bin/env bash
set -euo pipefail

RUNS=3
WARMUP_RUNS=1
BUDGET_FILE=""
OUTPUT_FILE=""
ENFORCE_BUDGETS=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runs|-n)
      RUNS="$2"
      shift 2
      ;;
    --warmup-runs)
      WARMUP_RUNS="$2"
      shift 2
      ;;
    --budget)
      BUDGET_FILE="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --no-enforce-budgets)
      ENFORCE_BUDGETS=0
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if ! [[ "$RUNS" =~ ^[0-9]+$ ]] || [[ "$RUNS" -le 0 ]]; then
  echo "Invalid --runs value: $RUNS" >&2
  exit 2
fi
if ! [[ "$WARMUP_RUNS" =~ ^[0-9]+$ ]]; then
  echo "Invalid --warmup-runs value: $WARMUP_RUNS" >&2
  exit 2
fi

MIN_RUNS=3
MAX_FAILED_RUNS=0
MAX_P95_MS=30000
WARN_AVG_MS=20000

if [[ -n "$BUDGET_FILE" ]]; then
  MIN_RUNS="$(node -e "const b=require('./${BUDGET_FILE}'); process.stdout.write(String(b.minRuns ?? 3));")"
  MAX_FAILED_RUNS="$(node -e "const b=require('./${BUDGET_FILE}'); process.stdout.write(String(b.maxFailedRuns ?? 0));")"
  MAX_P95_MS="$(node -e "const b=require('./${BUDGET_FILE}'); process.stdout.write(String(b.maxP95Ms ?? 30000));")"
  WARN_AVG_MS="$(node -e "const b=require('./${BUDGET_FILE}'); process.stdout.write(String(b.warnAvgMs ?? 20000));")"
fi

declare -a TIMES_MS=()
declare -a STATUSES=()
FAILED_RUNS=0

TOTAL_RUNS=$((RUNS + WARMUP_RUNS))
for ((i=1; i<=TOTAL_RUNS; i++)); do
  START_MS="$(date +%s%3N)"
  if pnpm --filter @scheduler/web test >/tmp/web-test-stability-run-"$i".log 2>&1; then
    STATUS=0
  else
    STATUS=$?
    FAILED_RUNS=$((FAILED_RUNS + 1))
  fi
  END_MS="$(date +%s%3N)"
  ELAPSED_MS=$((END_MS - START_MS))
  IS_WARMUP=0
  if [[ "$i" -le "$WARMUP_RUNS" ]]; then
    IS_WARMUP=1
  else
    TIMES_MS+=("$ELAPSED_MS")
    STATUSES+=("$STATUS")
  fi

  if [[ "$IS_WARMUP" -eq 1 ]]; then
    echo "Warmup $i/$WARMUP_RUNS: ${ELAPSED_MS}ms (status=$STATUS)"
  else
    MEASURED_INDEX=$((i - WARMUP_RUNS))
    echo "Run $MEASURED_INDEX/$RUNS: ${ELAPSED_MS}ms (status=$STATUS)"
  fi
  if [[ "$STATUS" -ne 0 ]]; then
    cat /tmp/web-test-stability-run-"$i".log
  fi
done

SORTED="$(printf "%s\n" "${TIMES_MS[@]}" | sort -n)"
AVG_MS="$(printf "%s\n" "${TIMES_MS[@]}" | awk '{sum+=$1} END {printf "%.3f", sum/NR}')"
MIN_MS="$(printf "%s\n" "$SORTED" | head -n1)"
MAX_MS="$(printf "%s\n" "$SORTED" | tail -n1)"
P50_IDX=$(( (RUNS + 1) / 2 ))
P50_MS="$(printf "%s\n" "$SORTED" | sed -n "${P50_IDX}p")"
P95_IDX=$(( (95 * RUNS + 99) / 100 ))
if [[ "$P95_IDX" -lt 1 ]]; then P95_IDX=1; fi
if [[ "$P95_IDX" -gt "$RUNS" ]]; then P95_IDX="$RUNS"; fi
P95_MS="$(printf "%s\n" "$SORTED" | sed -n "${P95_IDX}p")"

echo "Summary: warmupRuns=$WARMUP_RUNS runs=$RUNS failedRuns=$FAILED_RUNS min=${MIN_MS}ms max=${MAX_MS}ms avg=${AVG_MS}ms p50=${P50_MS}ms p95=${P95_MS}ms"

if [[ -n "$OUTPUT_FILE" ]]; then
  {
    printf "{\n"
    printf "  \"benchmark\": \"web-test-stability\",\n"
    printf "  \"generatedAt\": \"%s\",\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    printf "  \"command\": \"pnpm --filter @scheduler/web test\",\n"
    printf "  \"metrics\": {\n"
    printf "    \"warmupRuns\": %s,\n" "$WARMUP_RUNS"
    printf "    \"runs\": %s,\n" "$RUNS"
    printf "    \"minMs\": %s,\n" "$MIN_MS"
    printf "    \"maxMs\": %s,\n" "$MAX_MS"
    printf "    \"avgMs\": %s,\n" "$AVG_MS"
    printf "    \"p50Ms\": %s,\n" "$P50_MS"
    printf "    \"p95Ms\": %s\n" "$P95_MS"
    printf "  },\n"
    printf "  \"runs\": [\n"
    for ((i=0; i<${#TIMES_MS[@]}; i++)); do
      SEP=","
      if [[ "$i" -eq $((${#TIMES_MS[@]} - 1)) ]]; then SEP=""; fi
      printf "    {\"iteration\": %s, \"elapsedMs\": %s, \"status\": %s}%s\n" "$((i + 1))" "${TIMES_MS[$i]}" "${STATUSES[$i]}" "$SEP"
    done
    printf "  ]\n"
    printf "}\n"
  } >"$OUTPUT_FILE"
  echo "Saved report: $OUTPUT_FILE"
fi

if [[ "$ENFORCE_BUDGETS" -eq 0 ]]; then
  exit 0
fi

if [[ "$RUNS" -lt "$MIN_RUNS" ]]; then
  echo "[no-go] runs=$RUNS < minRuns=$MIN_RUNS"
  exit 1
fi

if [[ "$FAILED_RUNS" -gt "$MAX_FAILED_RUNS" ]]; then
  echo "[no-go] failedRuns=$FAILED_RUNS > maxFailedRuns=$MAX_FAILED_RUNS"
  exit 1
fi

if [[ "$P95_MS" -gt "$MAX_P95_MS" ]]; then
  echo "[no-go] p95Ms=$P95_MS > maxP95Ms=$MAX_P95_MS"
  exit 1
fi

if awk "BEGIN {exit !($AVG_MS > $WARN_AVG_MS)}"; then
  echo "[warn] avgMs=$AVG_MS > warnAvgMs=$WARN_AVG_MS"
else
  echo "[go] avgMs=$AVG_MS <= warnAvgMs=$WARN_AVG_MS"
fi

echo "[go] Web test stability check passed."
