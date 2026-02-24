# Error Catalog Template

- code: `VALIDATION_ERROR`
  httpStatus: 400
  message: Invalid request payload
  details: Per-field Zod errors

- code: `UNPROCESSABLE_SCENARIO`
  httpStatus: 422
  message: Scenario violates scheduling constraints
  details: Business-rule violations

- code: `ENGINE_EXECUTION_FAILED`
  httpStatus: 500
  message: Solver engine failed
  details: Engine stderr summary or timeout metadata
