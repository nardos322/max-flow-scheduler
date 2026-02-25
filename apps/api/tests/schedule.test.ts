import { describe, expect, it, vi } from 'vitest';
import { solveScheduleHandler } from '../src/app.js';

describe('solveScheduleHandler', () => {
  it('rejects invalid payloads with field issues', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json };

    await solveScheduleHandler(
      {
        body: {
          doctors: [{ id: 'd1', maxTotalDays: 2 }],
          demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
          availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
        },
      } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid schedule payload',
        issues: expect.any(Array),
      }),
    );
  });

  it('returns a contract-valid draft response for valid payload', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json };

    await solveScheduleHandler(
      {
        body: {
          contractVersion: '1.0',
          doctors: [{ id: 'd1', maxTotalDays: 2 }],
          periods: [{ id: 'p1', dayIds: ['day-1'] }],
          demands: [{ dayId: 'day-1', requiredDoctors: 1 }],
          availability: [{ doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }],
        },
      } as never,
      res as never,
      vi.fn(),
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      contractVersion: '1.0',
      isFeasible: false,
      assignedCount: 0,
      uncoveredDays: ['day-1'],
      assignments: [],
    });
  });
});
