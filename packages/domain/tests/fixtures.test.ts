import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { solveRequestSchema } from '../src/index.js';

type FixtureCatalogEntry = {
  id: string;
  requestFile: string;
  expectSchemaValid: boolean;
};

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));
const catalogPath = path.join(fixturesDir, 'catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as FixtureCatalogEntry[];

describe('domain fixture catalog', () => {
  it('validates every fixture against solve request schema expectations', () => {
    for (const fixture of catalog) {
      const raw = readFileSync(path.join(fixturesDir, fixture.requestFile), 'utf8');
      const payload = JSON.parse(raw) as unknown;
      const parsed = solveRequestSchema.safeParse(payload);
      expect(parsed.success, fixture.id).toBe(fixture.expectSchemaValid);
    }
  });
});
