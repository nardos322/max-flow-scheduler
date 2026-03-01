# US-201.3 Multi-Module Compatibility Report (2026-03-01)

## Boundary Map
- Web -> API: `POST /schedule/solve` payload validated with `solveRequestSchema` in API.
- API -> Engine client boundary: solver output validated against `solveResponseSchema` before API response/persistence.
- Engine client -> C++ binary: stdout JSON decoded and validated against shared `solveResponseSchema`.
- Shared package -> consumers: `@scheduler/domain` remains single source for request/response and sprint schemas.

## Contract Drift Report
- Detected drift risk: sprint solve flow persisted solver output without validating `solveResponseSchema`.
- Detected drift risk: `@scheduler/engine-client` decoded solver JSON without schema validation.
- Mitigation applied:
  - API sprint run controller now validates solver output and records failed run on mismatch.
  - Engine client now validates decoded payload with shared schema and throws on mismatch.
  - Regression tests added in API and engine client.

## Integration Change Plan
1. Enforce shared response contract validation at all solver output entry points.
2. Add negative tests for contract mismatch behavior.
3. Keep error shape stable (`500 Internal contract mismatch`) for API callers.
4. Mark US-201.3 complete after green tests.

## Verification Checklist
- Contract version updates applied: N/A (`1.0` unchanged).
- Adapters updated in all consumers: done for API sprint flow and engine-client parser.
- Integration tests pass with real dependencies: API suite green with SQLite migrations.
- Error mapping verified end-to-end: mismatch now results in controlled `500` and failed run trace.
