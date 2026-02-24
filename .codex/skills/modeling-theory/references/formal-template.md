# Formal Model Template

- Sets: doctors, periods, days, availability edges.
- Parameters: `C_i`, `R_d`.
- Decision vars: assignment indicators.
- Constraints:
  - Max total days per doctor.
  - Max one day per doctor-period.
  - Daily demand coverage.
  - Availability-only assignments.
- Objective (feasibility form): satisfy all demands.
