import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openApiDocument } from '../src/docs/openapi.js';

describe('openapi exported artifact', () => {
  it('matches the runtime OpenAPI document', () => {
    const exportedPath = resolve(process.cwd(), 'openapi.json');
    const exported = JSON.parse(readFileSync(exportedPath, 'utf8')) as unknown;

    expect(exported).toEqual(openApiDocument);
  });
});
