import { describe, expect, it, vi } from 'vitest';
import { healthController } from '../src/controllers/health.controller.js';

describe('healthController', () => {
  it('returns status ok', async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json };

    await healthController({} as never, res as never, vi.fn());

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ status: 'ok' });
  });
});
