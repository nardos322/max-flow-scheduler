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

export const doctorCatalogSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean(),
  maxTotalDaysDefault: z.number().int().positive().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createDoctorRequestSchema = z.object({
  name: z.string().min(1),
  active: z.boolean().optional(),
  maxTotalDaysDefault: z.number().int().positive().optional(),
});

export const updateDoctorRequestSchema = z
  .object({
    name: z.string().min(1).optional(),
    active: z.boolean().optional(),
    maxTotalDaysDefault: z.number().int().positive().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const periodDemandSchema = z.object({
  dayId: z.string().date(),
  requiredDoctors: z.number().int().positive(),
});

export const periodCatalogSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    startsOn: z.string().date(),
    endsOn: z.string().date(),
    demands: z.array(periodDemandSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .superRefine((value, ctx) => {
    if (value.startsOn > value.endsOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsOn'],
        message: 'Period end must be on or after start.',
      });
    }

    const seen = new Set<string>();
    value.demands.forEach((demand, index) => {
      if (seen.has(demand.dayId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['demands', index, 'dayId'],
          message: `Duplicate demand day '${demand.dayId}'.`,
        });
      }
      seen.add(demand.dayId);

      if (demand.dayId < value.startsOn || demand.dayId > value.endsOn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['demands', index, 'dayId'],
          message: `Demand day '${demand.dayId}' is outside period range.`,
        });
      }
    });
  });

export const createPeriodRequestSchema = z
  .object({
    name: z.string().min(1),
    startsOn: z.string().date(),
    endsOn: z.string().date(),
    demands: z.array(periodDemandSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.startsOn > value.endsOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsOn'],
        message: 'Period end must be on or after start.',
      });
    }

    const seen = new Set<string>();
    value.demands.forEach((demand, index) => {
      if (seen.has(demand.dayId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['demands', index, 'dayId'],
          message: `Duplicate demand day '${demand.dayId}'.`,
        });
      }
      seen.add(demand.dayId);

      if (demand.dayId < value.startsOn || demand.dayId > value.endsOn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['demands', index, 'dayId'],
          message: `Demand day '${demand.dayId}' is outside period range.`,
        });
      }
    });
  });

export const updatePeriodRequestSchema = z
  .object({
    name: z.string().min(1).optional(),
    startsOn: z.string().date().optional(),
    endsOn: z.string().date().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const replacePeriodDemandsRequestSchema = z.object({
  demands: z.array(periodDemandSchema),
});

export const sprintStatusSchema = z.enum(['draft', 'ready-to-solve', 'solved']);

export const sprintGlobalConfigSchema = z.object({
  requiredDoctorsPerShift: z.number().int().positive(),
  maxDaysPerDoctorDefault: z.number().int().positive(),
});

export const userRoleSchema = z.enum(['doctor', 'planner']);

export const sprintAvailabilitySourceSchema = z.enum(['doctor-self-service', 'planner-override']);

export const sprintAvailabilityEntrySchema = z.object({
  doctorId: z.string().min(1),
  periodId: z.string().min(1),
  dayId: z.string().min(1),
  source: sprintAvailabilitySourceSchema,
  updatedByUserId: z.string().min(1),
  updatedByRole: userRoleSchema,
  updatedAt: z.string().datetime(),
});

export const availabilityDaySchema = z.object({
  periodId: z.string().min(1),
  dayId: z.string().min(1),
});

function ensureUniqueAvailabilityDays(
  days: Array<{ periodId: string; dayId: string }>,
  ctx: z.RefinementCtx,
  pathPrefix: string,
) {
  const keys = new Set<string>();
  days.forEach((entry, index) => {
    const key = `${entry.periodId}::${entry.dayId}`;
    if (keys.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [pathPrefix, index],
        message: `Duplicate availability day '${key}'.`,
      });
    }
    keys.add(key);
  });
}

export const setDoctorAvailabilityRequestSchema = z
  .object({
    availability: z.array(availabilityDaySchema),
  })
  .superRefine((value, ctx) => {
    ensureUniqueAvailabilityDays(value.availability, ctx, 'availability');
  });

export const plannerOverrideAvailabilityRequestSchema = z
  .object({
    doctorId: z.string().min(1),
    availability: z.array(availabilityDaySchema),
  })
  .superRefine((value, ctx) => {
    ensureUniqueAvailabilityDays(value.availability, ctx, 'availability');
  });

export const sprintSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  periodId: z.string().min(1),
  status: sprintStatusSchema,
  globalConfig: sprintGlobalConfigSchema,
  doctorIds: z.array(z.string().min(1)),
  availability: z.array(sprintAvailabilityEntrySchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createSprintRequestSchema = z.object({
  name: z.string().min(1),
  periodId: z.string().min(1),
  globalConfig: sprintGlobalConfigSchema,
  doctorIds: z.array(z.string().min(1)).default([]),
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
export type DoctorCatalog = z.infer<typeof doctorCatalogSchema>;
export type CreateDoctorRequest = z.infer<typeof createDoctorRequestSchema>;
export type UpdateDoctorRequest = z.infer<typeof updateDoctorRequestSchema>;
export type PeriodDemand = z.infer<typeof periodDemandSchema>;
export type PeriodCatalog = z.infer<typeof periodCatalogSchema>;
export type CreatePeriodRequest = z.infer<typeof createPeriodRequestSchema>;
export type UpdatePeriodRequest = z.infer<typeof updatePeriodRequestSchema>;
export type ReplacePeriodDemandsRequest = z.infer<typeof replacePeriodDemandsRequestSchema>;
export type Sprint = z.infer<typeof sprintSchema>;
export type SprintGlobalConfig = z.infer<typeof sprintGlobalConfigSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type SprintAvailabilityEntry = z.infer<typeof sprintAvailabilityEntrySchema>;
export type AvailabilityDay = z.infer<typeof availabilityDaySchema>;
export type SetDoctorAvailabilityRequest = z.infer<typeof setDoctorAvailabilityRequestSchema>;
export type PlannerOverrideAvailabilityRequest = z.infer<typeof plannerOverrideAvailabilityRequestSchema>;
export type CreateSprintRequest = z.infer<typeof createSprintRequestSchema>;
export type UpdateSprintGlobalConfigRequest = z.infer<typeof updateSprintGlobalConfigRequestSchema>;
export type SprintRun = z.infer<typeof sprintRunSchema>;
export type MarkSprintReadyRequest = z.infer<typeof markSprintReadyRequestSchema>;
export type RunSprintSolveRequest = z.infer<typeof runSprintSolveRequestSchema>;
