import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sprintSchema, type Sprint } from '@scheduler/domain';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultStoreFile = path.resolve(moduleDir, '../../../../.data/sprints.json');

function isPersistenceEnabled(): boolean {
  const configured = process.env.SPRINT_PERSISTENCE?.trim().toLowerCase();
  if (configured === 'on') {
    return true;
  }
  if (configured === 'off') {
    return false;
  }

  return !('VITEST' in process.env);
}

const persistenceEnabled = isPersistenceEnabled();
const sprintStoreFile = path.resolve(process.env.SPRINT_STORE_FILE?.trim() || defaultStoreFile);

function loadPersistedSprints(): Sprint[] {
  if (!persistenceEnabled) {
    return [];
  }

  try {
    const serialized = readFileSync(sprintStoreFile, 'utf8');
    const parsed = JSON.parse(serialized) as unknown;
    const sprintArraySchema = sprintSchema.array();
    return sprintArraySchema.parse(parsed);
  } catch {
    return [];
  }
}

function persistSprints(store: Map<string, Sprint>): void {
  if (!persistenceEnabled) {
    return;
  }

  mkdirSync(path.dirname(sprintStoreFile), { recursive: true });
  writeFileSync(sprintStoreFile, JSON.stringify([...store.values()], null, 2), 'utf8');
}

const sprintStore = new Map<string, Sprint>(loadPersistedSprints().map((sprint) => [sprint.id, sprint]));

export function saveSprint(sprint: Sprint): Sprint {
  sprintStore.set(sprint.id, sprint);
  persistSprints(sprintStore);
  return sprint;
}

export function getSprintById(id: string): Sprint | null {
  return sprintStore.get(id) ?? null;
}

export function listSprints(): Sprint[] {
  return [...sprintStore.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function clearSprintStore(): void {
  sprintStore.clear();
  if (persistenceEnabled) {
    rmSync(sprintStoreFile, { force: true });
  }
}
