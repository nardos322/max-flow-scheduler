import { z } from 'zod';

export const contractVersionSchema = z.literal('1.0');

export const availabilitySchema = z.object({
  doctorId: z.string().min(1),
  periodId: z.string().min(1),
  dayId: z.string().min(1),
});

export const periodSchema = z.object({
  id: z.string().min(1),
  dayIds: z.array(z.string().min(1)).min(1),
});

export const doctorSchema = z.object({
  id: z.string().min(1),
  maxTotalDays: z.number().int().nonnegative(),
});

export const dayDemandSchema = z.object({
  dayId: z.string().min(1),
  requiredDoctors: z.number().int().positive(),
});

export const solveRequestSchema = z
  .object({
    contractVersion: contractVersionSchema.default('1.0'),
    doctors: z.array(doctorSchema),
    periods: z.array(periodSchema),
    demands: z.array(dayDemandSchema),
    availability: z.array(availabilitySchema),
  })
  .superRefine((value, ctx) => {
    const doctorIds = new Set<string>();
    value.doctors.forEach((doctor, index) => {
      if (doctorIds.has(doctor.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['doctors', index, 'id'],
          message: `Duplicate doctor id '${doctor.id}'.`,
        });
      }
      doctorIds.add(doctor.id);
    });

    const periodIds = new Set<string>();
    const periodDaysById = new Map<string, Set<string>>();
    value.periods.forEach((period, periodIndex) => {
      if (periodIds.has(period.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['periods', periodIndex, 'id'],
          message: `Duplicate period id '${period.id}'.`,
        });
      }
      periodIds.add(period.id);

      const dayIdsInPeriod = new Set<string>();
      period.dayIds.forEach((dayId, dayIndex) => {
        if (dayIdsInPeriod.has(dayId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['periods', periodIndex, 'dayIds', dayIndex],
            message: `Duplicate day id '${dayId}' inside period '${period.id}'.`,
          });
        }
        dayIdsInPeriod.add(dayId);
      });

      periodDaysById.set(period.id, dayIdsInPeriod);
    });

    const demandDayIds = new Set<string>();
    value.demands.forEach((demand, index) => {
      if (demandDayIds.has(demand.dayId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['demands', index, 'dayId'],
          message: `Duplicate demand for day '${demand.dayId}'.`,
        });
      }
      demandDayIds.add(demand.dayId);

      const existsInSomePeriod = value.periods.some((period) => period.dayIds.includes(demand.dayId));
      if (!existsInSomePeriod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['demands', index, 'dayId'],
          message: `Demand day '${demand.dayId}' is not declared in any period.`,
        });
      }
    });

    const availabilityKeys = new Set<string>();
    value.availability.forEach((item, index) => {
      if (!doctorIds.has(item.doctorId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availability', index, 'doctorId'],
          message: `Availability references unknown doctor '${item.doctorId}'.`,
        });
      }

      if (!periodIds.has(item.periodId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availability', index, 'periodId'],
          message: `Availability references unknown period '${item.periodId}'.`,
        });
      } else if (!periodDaysById.get(item.periodId)?.has(item.dayId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availability', index, 'dayId'],
          message: `Day '${item.dayId}' is not part of period '${item.periodId}'.`,
        });
      }

      const key = `${item.doctorId}::${item.periodId}::${item.dayId}`;
      if (availabilityKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availability', index],
          message: `Duplicate availability entry '${key}'.`,
        });
      }
      availabilityKeys.add(key);
    });
  });

export const assignmentSchema = z.object({
  doctorId: z.string(),
  dayId: z.string(),
  periodId: z.string(),
});

export const minCutEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  capacity: z.number().int().nonnegative(),
});

export const minCutSchema = z.object({
  value: z.number().int().nonnegative(),
  reachableNodes: z.array(z.string().min(1)),
  cutEdges: z.array(minCutEdgeSchema),
});

export const solveResponseSchema = z.object({
  contractVersion: contractVersionSchema.default('1.0'),
  isFeasible: z.boolean(),
  assignedCount: z.number().int().nonnegative(),
  uncoveredDays: z.array(z.string()),
  assignments: z.array(assignmentSchema),
  minCut: minCutSchema.optional(),
});

export const sprintStatusSchema = z.enum(['draft', 'ready-to-solve', 'solved']);

export const sprintGlobalConfigSchema = z.object({
  requiredDoctorsPerShift: z.number().int().positive(),
  maxDaysPerDoctorDefault: z.number().int().positive(),
});

export const sprintDoctorSchema = z.object({
  id: z.string().min(1),
  maxTotalDaysOverride: z.number().int().positive().optional(),
});

export const sprintSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  startsOn: z.string().date(),
  endsOn: z.string().date(),
  status: sprintStatusSchema,
  globalConfig: sprintGlobalConfigSchema,
  doctors: z.array(sprintDoctorSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createSprintRequestSchema = z.object({
  name: z.string().min(1),
  startsOn: z.string().date(),
  endsOn: z.string().date(),
  globalConfig: sprintGlobalConfigSchema,
  doctors: z.array(sprintDoctorSchema).default([]),
});

export const updateSprintGlobalConfigRequestSchema = z.object({
  globalConfig: sprintGlobalConfigSchema,
});

export const runStatusSchema = z.enum(['succeeded', 'failed']);

export const sprintRunSchema = z.object({
  id: z.string().min(1),
  sprintId: z.string().min(1),
  executedAt: z.string().datetime(),
  status: runStatusSchema,
  inputSnapshot: solveRequestSchema,
  outputSnapshot: solveResponseSchema.optional(),
  error: z
    .object({
      code: z.string().min(1),
      message: z.string().min(1),
    })
    .optional(),
});

export const markSprintReadyRequestSchema = z.object({
  status: z.literal('ready-to-solve'),
});

export const runSprintSolveRequestSchema = z.object({
  request: solveRequestSchema,
});

export type SolveRequest = z.infer<typeof solveRequestSchema>;
export type SolveResponse = z.infer<typeof solveResponseSchema>;
export type Sprint = z.infer<typeof sprintSchema>;
export type SprintGlobalConfig = z.infer<typeof sprintGlobalConfigSchema>;
export type SprintDoctor = z.infer<typeof sprintDoctorSchema>;
export type CreateSprintRequest = z.infer<typeof createSprintRequestSchema>;
export type UpdateSprintGlobalConfigRequest = z.infer<typeof updateSprintGlobalConfigRequestSchema>;
export type SprintRun = z.infer<typeof sprintRunSchema>;
export type MarkSprintReadyRequest = z.infer<typeof markSprintReadyRequestSchema>;
export type RunSprintSolveRequest = z.infer<typeof runSprintSolveRequestSchema>;
