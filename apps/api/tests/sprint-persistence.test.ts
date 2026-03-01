import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sprint repository persistence', () => {
  let tempDir: string | null = null;

  afterEach(() => {
    vi.resetModules();
    delete process.env.SPRINT_PERSISTENCE;
    delete process.env.SPRINT_STORE_FILE;

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it('persists updated sprint global config and reloads it after module restart', async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'sprint-store-'));
    process.env.SPRINT_PERSISTENCE = 'on';
    process.env.SPRINT_STORE_FILE = path.join(tempDir, 'sprints.json');

    const serviceModule = await import('../src/services/sprint/sprint.service.js');

    const created = serviceModule.createSprint({
      name: 'Guardias Persistencia',
      startsOn: '2026-08-01',
      endsOn: '2026-08-31',
      globalConfig: { requiredDoctorsPerShift: 1, maxDaysPerDoctorDefault: 6 },
      doctors: [{ id: 'd1' }],
    });

    serviceModule.updateSprintGlobalConfig(created.id, {
      requiredDoctorsPerShift: 3,
      maxDaysPerDoctorDefault: 9,
    });

    vi.resetModules();

    const reloadedModule = await import('../src/services/sprint/sprint.service.js');
    const reloadedSprint = reloadedModule.findSprintOrNull(created.id);

    expect(reloadedSprint).toEqual(
      expect.objectContaining({
        id: created.id,
        globalConfig: { requiredDoctorsPerShift: 3, maxDaysPerDoctorDefault: 9 },
      }),
    );
  });
});
