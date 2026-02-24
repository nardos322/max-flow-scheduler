import { z } from 'zod';

export const availabilitySchema = z.object({
  doctorId: z.string().min(1),
  periodId: z.string().min(1),
  dayId: z.string().min(1),
});

export const doctorSchema = z.object({
  id: z.string().min(1),
  maxTotalDays: z.number().int().nonnegative(),
});

export const dayDemandSchema = z.object({
  dayId: z.string().min(1),
  requiredDoctors: z.number().int().positive(),
});

export const solveRequestSchema = z.object({
  doctors: z.array(doctorSchema),
  demands: z.array(dayDemandSchema),
  availability: z.array(availabilitySchema),
});

export const assignmentSchema = z.object({
  doctorId: z.string(),
  dayId: z.string(),
  periodId: z.string(),
});

export const solveResponseSchema = z.object({
  isFeasible: z.boolean(),
  assignedCount: z.number().int().nonnegative(),
  uncoveredDays: z.array(z.string()),
  assignments: z.array(assignmentSchema),
});

export type SolveRequest = z.infer<typeof solveRequestSchema>;
export type SolveResponse = z.infer<typeof solveResponseSchema>;
