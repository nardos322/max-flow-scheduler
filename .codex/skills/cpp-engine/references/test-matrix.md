# Test Matrix

## Happy path
- Exact fit: supply equals demand.
- Oversupply: solver still covers all demand.

## Infeasible path
- Missing availability for at least one day.
- Doctor capacities too low.
- One-day-per-period restriction blocks full coverage.

## Edge cases
- Empty input.
- Single doctor, single day.
- Large scenario for performance sanity.
