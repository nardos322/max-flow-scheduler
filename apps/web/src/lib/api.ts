import {
  addPlanningCycleSprintRequestSchema,
  createPlanningCycleRequestSchema,
  markSprintReadyRequestSchema,
  planningCycleSchema,
  plannerOverrideAvailabilityRequestSchema,
  planningCycleListResponseSchema,
  planningCycleRunListResponseSchema,
  planningCycleRunSchema,
  runPlanningCycleRequestSchema,
  setDoctorAvailabilityRequestSchema,
  solveResponseSchema,
  sprintAvailabilityEntrySchema,
  sprintListResponseSchema,
  sprintRunListResponseSchema,
  sprintRunSchema,
  sprintSchema,
} from '@scheduler/domain';
import { z } from 'zod';

type ApiError = {
  error?: string;
  code?: string;
  requestId?: string;
};

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const runSolveResponseSchema = z.object({
  run: sprintRunSchema,
  result: solveResponseSchema,
});

const sprintAvailabilityListResponseSchema = z.object({
  items: z.array(sprintAvailabilityEntrySchema),
});

type PaginationOptions = {
  cursor?: string;
  limit?: number;
};

function buildHeaders(token: string): HeadersInit {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const trimmedToken = token.trim();
  if (trimmedToken.length > 0) {
    headers.authorization = `Bearer ${trimmedToken}`;
  }

  return headers;
}

function withPagination(path: string, options?: PaginationOptions): string {
  const params = new URLSearchParams();
  if (options?.cursor) {
    params.set('cursor', options.cursor);
  }
  if (options?.limit) {
    params.set('limit', String(options.limit));
  }
  const query = params.toString();
  if (query.length === 0) {
    return path;
  }
  return `${path}?${query}`;
}

async function parseApiError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => ({}))) as ApiError;
  return payload.error ?? `HTTP ${response.status}`;
}

export async function runSprintSolve(sprintId: string, token: string) {
  const response = await fetch(`${apiBaseUrl}/sprints/${encodeURIComponent(sprintId)}/runs`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return runSolveResponseSchema.parse(json);
}

export async function listSprintRuns(sprintId: string, token: string, options?: PaginationOptions) {
  const response = await fetch(withPagination(`${apiBaseUrl}/sprints/${encodeURIComponent(sprintId)}/runs`, options), {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return sprintRunListResponseSchema.parse(json);
}

export async function listSprints(token: string, options?: PaginationOptions) {
  const response = await fetch(withPagination(`${apiBaseUrl}/sprints`, options), {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return sprintListResponseSchema.parse(json);
}

export async function getSprint(sprintId: string, token: string) {
  const response = await fetch(`${apiBaseUrl}/sprints/${encodeURIComponent(sprintId)}`, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return sprintSchema.parse(json);
}

export async function listSprintAvailability(sprintId: string, token: string) {
  const response = await fetch(`${apiBaseUrl}/sprints/${encodeURIComponent(sprintId)}/availability`, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return sprintAvailabilityListResponseSchema.parse(json);
}

export async function setDoctorAvailability(params: {
  sprintId: string;
  doctorId: string;
  periodId: string;
  dayIds: string[];
  token: string;
}) {
  const payload = setDoctorAvailabilityRequestSchema.parse({
    availability: params.dayIds.map((dayId) => ({ periodId: params.periodId, dayId })),
  });

  const response = await fetch(
    `${apiBaseUrl}/sprints/${encodeURIComponent(params.sprintId)}/doctors/${encodeURIComponent(params.doctorId)}/availability`,
    {
      method: 'PUT',
      headers: buildHeaders(params.token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return sprintSchema.parse(json);
}

export async function setPlannerOverrideAvailability(params: {
  sprintId: string;
  doctorId: string;
  periodId: string;
  dayIds: string[];
  token: string;
}) {
  const payload = plannerOverrideAvailabilityRequestSchema.parse({
    doctorId: params.doctorId,
    availability: params.dayIds.map((dayId) => ({ periodId: params.periodId, dayId })),
  });

  const response = await fetch(`${apiBaseUrl}/sprints/${encodeURIComponent(params.sprintId)}/availability/override`, {
    method: 'PUT',
    headers: buildHeaders(params.token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return sprintSchema.parse(json);
}

export async function markSprintReady(sprintId: string, token: string) {
  const payload = markSprintReadyRequestSchema.parse({ status: 'ready-to-solve' });
  const response = await fetch(`${apiBaseUrl}/sprints/${encodeURIComponent(sprintId)}/status`, {
    method: 'PATCH',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return sprintSchema.parse(json);
}

export async function listPlanningCycles(token: string, options?: PaginationOptions) {
  const response = await fetch(withPagination(`${apiBaseUrl}/planning-cycles`, options), {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return planningCycleListResponseSchema.parse(json);
}

export async function createPlanningCycle(token: string, name: string) {
  const payload = createPlanningCycleRequestSchema.parse({ name });
  const response = await fetch(`${apiBaseUrl}/planning-cycles`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return planningCycleSchema.parse(json);
}

export async function getPlanningCycle(token: string, cycleId: string) {
  const response = await fetch(`${apiBaseUrl}/planning-cycles/${encodeURIComponent(cycleId)}`, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return planningCycleSchema.parse(json);
}

export async function addSprintToCycle(token: string, cycleId: string, sprintId: string, orderIndex?: number) {
  const payload = addPlanningCycleSprintRequestSchema.parse({ sprintId, orderIndex });
  const response = await fetch(`${apiBaseUrl}/planning-cycles/${encodeURIComponent(cycleId)}/sprints`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return planningCycleSchema.parse(json);
}

export async function runPlanningCycle(token: string, cycleId: string) {
  const payload = runPlanningCycleRequestSchema.parse({});
  const response = await fetch(`${apiBaseUrl}/planning-cycles/${encodeURIComponent(cycleId)}/runs`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return planningCycleRunSchema.parse(json);
}

export async function listPlanningCycleRuns(token: string, cycleId: string, options?: PaginationOptions) {
  const response = await fetch(
    withPagination(`${apiBaseUrl}/planning-cycles/${encodeURIComponent(cycleId)}/runs`, options),
    {
      method: 'GET',
      headers: buildHeaders(token),
    },
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return planningCycleRunListResponseSchema.parse(json);
}
