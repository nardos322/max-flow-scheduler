import { describe, expect, it } from 'vitest';
import { parseSolveResponsePayload } from './index.js';

describe('parseSolveResponsePayload', () => {
  it('accepts payloads matching shared contract', () => {
    const parsed = parseSolveResponsePayload({
      contractVersion: '1.0',
      isFeasible: true,
      assignedCount: 1,
      uncoveredDays: [],
      assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
    });

    expect(parsed.assignedCount).toBe(1);
  });

  it('rejects payloads that drift from shared contract', () => {
    expect(() =>
      parseSolveResponsePayload({
        contractVersion: '1.0',
        isFeasible: true,
        uncoveredDays: [],
        assignments: [{ doctorId: 'd1', dayId: 'day-1', periodId: 'p1' }],
      }),
    ).toThrowError('Engine response contract mismatch');
  });
});
