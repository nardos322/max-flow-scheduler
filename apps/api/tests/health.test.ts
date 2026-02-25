import { describe, expect, it, vi } from 'vitest';
import { healthHandler } from '../src/app.js';

describe('healthHandler', () => {
  it('returns status ok', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json };

    await healthHandler({} as never, res as never, vi.fn());

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ status: 'ok' });
  });
});
