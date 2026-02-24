import { describe, expect, it } from 'vitest';
import { solveRequestSchema } from '../src/index.js';

describe('solveRequestSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = solveRequestSchema.safeParse({
      doctors: [{ id: 'd1', maxTotalDays: 2 }],
      demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
      availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
    });

    expect(result.success).toBe(true);
  });
});
