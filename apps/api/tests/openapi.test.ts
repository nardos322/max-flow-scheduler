import { describe, expect, it } from 'vitest';
import { openApiDocument } from '../src/docs/openapi.js';

describe('openApiDocument', () => {
  it('defines baseline metadata and key paths', () => {
    expect(openApiDocument.openapi).toBe('3.0.3');
    expect(openApiDocument.info.title).toBe('Max Flow Scheduler API');
    expect(openApiDocument.paths['/health']).toBeDefined();
    expect(openApiDocument.paths['/schedule/solve']).toBeDefined();
    expect(openApiDocument.paths['/sprints/{sprintId}/runs']).toBeDefined();
  });
});
