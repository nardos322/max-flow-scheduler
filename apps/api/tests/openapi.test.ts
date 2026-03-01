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

  it('marks direct solve as transitional for MVP', () => {
    expect(openApiDocument.paths['/schedule/solve'].post.deprecated).toBe(true);
    expect(openApiDocument.paths['/schedule/solve'].post.description).toContain('sprint-first');
  });

  it('uses detailed schemas for key request bodies', () => {
    expect(
      openApiDocument.paths['/doctors'].post.requestBody.content['application/json'].schema.$ref,
    ).toBe('#/components/schemas/CreateDoctorRequest');
    expect(
      openApiDocument.paths['/periods/{periodId}/demands'].put.requestBody.content['application/json'].schema.$ref,
    ).toBe('#/components/schemas/ReplacePeriodDemandsRequest');
    expect(
      openApiDocument.paths['/schedule/solve'].post.requestBody.content['application/json'].schema.$ref,
    ).toBe('#/components/schemas/SolveRequest');
  });

  it('declares typed success responses for sprint run flow', () => {
    expect(
      openApiDocument.paths['/sprints/{sprintId}/runs'].post.responses['200'].content['application/json'].schema.$ref,
    ).toBe('#/components/schemas/RunSprintSolveResponse');
    expect(
      openApiDocument.paths['/sprints/{sprintId}/runs'].get.responses['200'].content['application/json'].schema.$ref,
    ).toBe('#/components/schemas/SprintRunListResponse');
  });
});
