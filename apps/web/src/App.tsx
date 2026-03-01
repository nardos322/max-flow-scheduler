import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Play, RefreshCcw, Shield, TriangleAlert, UserRoundCog, Users } from 'lucide-react';
import {
  markSprintReadyRequestSchema,
  plannerOverrideAvailabilityRequestSchema,
  setDoctorAvailabilityRequestSchema,
  solveResponseSchema,
  sprintAvailabilityEntrySchema,
  sprintRunSchema,
  sprintSchema,
} from '@scheduler/domain';
import { z } from 'zod';
import { Button } from './components/ui/button.js';
import { Card } from './components/ui/card.js';

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

const sprintRunListResponseSchema = z.object({
  items: z.array(sprintRunSchema),
});

const sprintAvailabilityListResponseSchema = z.object({
  items: z.array(sprintAvailabilityEntrySchema),
});

type RunSolveResponse = z.infer<typeof runSolveResponseSchema>;
type SprintRunListResponse = z.infer<typeof sprintRunListResponseSchema>;
type SprintAvailabilityListResponse = z.infer<typeof sprintAvailabilityListResponseSchema>;

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

async function parseApiError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => ({}))) as ApiError;
  return payload.error ?? `HTTP ${response.status}`;
}

async function runSprintSolve(sprintId: string, token: string): Promise<RunSolveResponse> {
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

async function listSprintRuns(sprintId: string, token: string): Promise<SprintRunListResponse> {
  const response = await fetch(`${apiBaseUrl}/sprints/${encodeURIComponent(sprintId)}/runs`, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as unknown;
  return sprintRunListResponseSchema.parse(json);
}

async function getSprint(sprintId: string, token: string) {
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

async function listSprintAvailability(sprintId: string, token: string): Promise<SprintAvailabilityListResponse> {
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

async function setDoctorAvailability(params: {
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

async function setPlannerOverrideAvailability(params: {
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

async function markSprintReady(sprintId: string, token: string) {
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

function formatIso(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

function parseDayIds(raw: string): string[] {
  const unique = new Set(
    raw
      .split(/[\s,]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
  );

  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

export function App() {
  const [sprintId, setSprintId] = useState('');
  const [token, setToken] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [doctorPeriodId, setDoctorPeriodId] = useState('');
  const [doctorDays, setDoctorDays] = useState('');
  const [overrideDoctorId, setOverrideDoctorId] = useState('');
  const [overridePeriodId, setOverridePeriodId] = useState('');
  const [overrideDays, setOverrideDays] = useState('');

  const historyQuery = useQuery({
    queryKey: ['sprint-runs', sprintId, token],
    queryFn: () => listSprintRuns(sprintId, token),
    enabled: false,
    retry: false,
  });

  const sprintQuery = useQuery({
    queryKey: ['sprint', sprintId, token],
    queryFn: () => getSprint(sprintId, token),
    enabled: false,
    retry: false,
  });

  const availabilityQuery = useQuery({
    queryKey: ['sprint-availability', sprintId, token],
    queryFn: () => listSprintAvailability(sprintId, token),
    enabled: false,
    retry: false,
  });

  const solveMutation = useMutation({
    mutationFn: () => runSprintSolve(sprintId, token),
    onSuccess: async () => {
      await Promise.all([historyQuery.refetch(), availabilityQuery.refetch(), sprintQuery.refetch()]);
    },
  });

  const setDoctorAvailabilityMutation = useMutation({
    mutationFn: () =>
      setDoctorAvailability({
        sprintId,
        doctorId: doctorId.trim(),
        periodId: doctorPeriodId.trim(),
        dayIds: parseDayIds(doctorDays),
        token,
      }),
    onSuccess: async () => {
      await Promise.all([availabilityQuery.refetch(), sprintQuery.refetch()]);
    },
  });

  const setOverrideAvailabilityMutation = useMutation({
    mutationFn: () =>
      setPlannerOverrideAvailability({
        sprintId,
        doctorId: overrideDoctorId.trim(),
        periodId: overridePeriodId.trim(),
        dayIds: parseDayIds(overrideDays),
        token,
      }),
    onSuccess: async () => {
      await Promise.all([availabilityQuery.refetch(), sprintQuery.refetch()]);
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: () => markSprintReady(sprintId, token),
    onSuccess: async () => {
      await Promise.all([sprintQuery.refetch(), availabilityQuery.refetch(), historyQuery.refetch()]);
    },
  });

  const latestResult = solveMutation.data?.result;

  const assignmentsByDay = useMemo(() => {
    if (!latestResult) {
      return [] as Array<{ dayId: string; assignments: string[] }>;
    }

    const dayMap = new Map<string, string[]>();
    for (const assignment of latestResult.assignments) {
      const existing = dayMap.get(assignment.dayId) ?? [];
      existing.push(assignment.doctorId);
      dayMap.set(assignment.dayId, existing);
    }

    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dayId, assignments]) => ({ dayId, assignments }));
  }, [latestResult]);

  const firstError =
    (solveMutation.error as Error | null)?.message ??
    (historyQuery.error as Error | null)?.message ??
    (sprintQuery.error as Error | null)?.message ??
    (availabilityQuery.error as Error | null)?.message ??
    (setDoctorAvailabilityMutation.error as Error | null)?.message ??
    (setOverrideAvailabilityMutation.error as Error | null)?.message ??
    (markReadyMutation.error as Error | null)?.message;

  const hasSprintLoaded = Boolean(sprintQuery.data);
  const hasAvailability =
    (availabilityQuery.data?.items.length ?? 0) > 0 || (sprintQuery.data?.availability.length ?? 0) > 0;
  const isReadyToRun = sprintQuery.data?.status === 'ready-to-solve' || sprintQuery.data?.status === 'solved';

  const canRun = sprintId.trim().length > 0 && hasSprintLoaded && isReadyToRun;
  const canMarkReady = sprintId.trim().length > 0 && hasSprintLoaded && !isReadyToRun && !markReadyMutation.isPending;
  const canSetDoctorAvailability =
    sprintId.trim().length > 0 && doctorId.trim().length > 0 && doctorPeriodId.trim().length > 0;
  const canSetOverrideAvailability =
    sprintId.trim().length > 0 && overrideDoctorId.trim().length > 0 && overridePeriodId.trim().length > 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff4dd_0%,#fffdfa_38%,#f8fafc_100%)] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <h1 className="text-3xl font-black tracking-tight">Sprint Run Console</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ejecuta corridas del solver por sprint y administra disponibilidad por medico con trazabilidad de origen.
          </p>
        </Card>

        <Card className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto_auto_auto_auto] md:items-end">
            <label className="text-sm text-slate-700">
              Sprint ID
              <input
                aria-label="Sprint ID"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="sprint-123"
                value={sprintId}
                onChange={(event) => setSprintId(event.target.value)}
              />
            </label>

            <label className="text-sm text-slate-700">
              Bearer token
              <input
                aria-label="Bearer token"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="eyJ..."
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </label>

            <Button
              variant="outline"
              onClick={() => sprintQuery.refetch()}
              disabled={sprintId.trim().length === 0 || sprintQuery.isFetching}
              aria-label="Cargar sprint"
            >
              <Users className="mr-2 h-4 w-4" /> Sprint
            </Button>

            <Button
              variant="outline"
              onClick={() => availabilityQuery.refetch()}
              disabled={sprintId.trim().length === 0 || availabilityQuery.isFetching}
              aria-label="Cargar disponibilidad"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Disponibilidad
            </Button>

            <Button
              variant="outline"
              onClick={() => markReadyMutation.mutate()}
              disabled={!canMarkReady || !hasAvailability}
              aria-label="Marcar ready-to-solve"
            >
              {markReadyMutation.isPending ? 'Marcando...' : 'Marcar ready-to-solve'}
            </Button>

            <Button onClick={() => solveMutation.mutate()} disabled={!canRun || solveMutation.isPending} aria-label="Ejecutar corrida">
              <Play className="mr-2 h-4 w-4" />
              {solveMutation.isPending ? 'Ejecutando...' : 'Ejecutar corrida'}
            </Button>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold uppercase tracking-wide">Flujo recomendado</p>
            <p className="mt-1">1) Cargar sprint 2) Cargar disponibilidad 3) Marcar ready-to-solve 4) Ejecutar corrida.</p>
            {!hasSprintLoaded ? <p className="mt-1">Estado: falta cargar sprint.</p> : null}
            {hasSprintLoaded && !hasAvailability ? <p className="mt-1">Estado: falta disponibilidad para marcar ready.</p> : null}
            {hasSprintLoaded && hasAvailability && !isReadyToRun ? (
              <p className="mt-1">Estado: sprint listo para marcar ready-to-solve.</p>
            ) : null}
            {hasSprintLoaded && isReadyToRun ? <p className="mt-1">Estado: sprint listo para ejecutar.</p> : null}
          </div>

          {token.trim().length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5" />
              Si la API requiere auth, pega un JWT valido. En dev puedes usar <code>/auth/dev/token</code>.
            </p>
          ) : null}

          {firstError && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              <TriangleAlert className="h-4 w-4" />
              {firstError}
            </div>
          )}
        </Card>

        {sprintQuery.data ? (
          <Card className="space-y-2 border-slate-300 bg-white/70">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Sprint cargado</h2>
            <p className="text-sm text-slate-700">Estado: {sprintQuery.data.status}</p>
            <p className="text-sm text-slate-700">Periodo: {sprintQuery.data.periodId}</p>
            <p className="text-sm text-slate-700">
              Medicos: {sprintQuery.data.doctorIds.length > 0 ? sprintQuery.data.doctorIds.join(', ') : 'ninguno'}
            </p>
          </Card>
        ) : null}

        <Card className="space-y-4 border-sky-200 bg-sky-50/50">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-800">
            <UserRoundCog className="h-4 w-4" />
            Disponibilidad (US-552)
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-md border border-sky-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-800">Autogestion medico</h3>
              <label className="block text-sm text-slate-700">
                Doctor ID
                <input
                  aria-label="Doctor ID autogestion"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="doc-1"
                  value={doctorId}
                  onChange={(event) => setDoctorId(event.target.value)}
                />
              </label>
              <label className="block text-sm text-slate-700">
                Period ID
                <input
                  aria-label="Period ID autogestion"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="period-1"
                  value={doctorPeriodId}
                  onChange={(event) => setDoctorPeriodId(event.target.value)}
                />
              </label>
              <label className="block text-sm text-slate-700">
                Dias disponibles (separados por coma o salto de linea)
                <textarea
                  aria-label="Dias autogestion"
                  className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="2026-03-02\n2026-03-03"
                  value={doctorDays}
                  onChange={(event) => setDoctorDays(event.target.value)}
                />
              </label>
              <Button
                onClick={() => setDoctorAvailabilityMutation.mutate()}
                disabled={!canSetDoctorAvailability || setDoctorAvailabilityMutation.isPending}
                aria-label="Guardar disponibilidad medico"
              >
                {setDoctorAvailabilityMutation.isPending ? 'Guardando...' : 'Guardar disponibilidad medico'}
              </Button>
            </div>

            <div className="space-y-3 rounded-md border border-sky-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-800">Override planificador</h3>
              <label className="block text-sm text-slate-700">
                Doctor ID objetivo
                <input
                  aria-label="Doctor ID override"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="doc-2"
                  value={overrideDoctorId}
                  onChange={(event) => setOverrideDoctorId(event.target.value)}
                />
              </label>
              <label className="block text-sm text-slate-700">
                Period ID
                <input
                  aria-label="Period ID override"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="period-1"
                  value={overridePeriodId}
                  onChange={(event) => setOverridePeriodId(event.target.value)}
                />
              </label>
              <label className="block text-sm text-slate-700">
                Dias disponibles (separados por coma o salto de linea)
                <textarea
                  aria-label="Dias override"
                  className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="2026-03-04, 2026-03-05"
                  value={overrideDays}
                  onChange={(event) => setOverrideDays(event.target.value)}
                />
              </label>
              <Button
                variant="outline"
                onClick={() => setOverrideAvailabilityMutation.mutate()}
                disabled={!canSetOverrideAvailability || setOverrideAvailabilityMutation.isPending}
                aria-label="Guardar override planificador"
              >
                {setOverrideAvailabilityMutation.isPending ? 'Guardando...' : 'Guardar override planificador'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Si dejas el campo de dias vacio y guardas, la API reemplaza la disponibilidad de ese medico por lista vacia.
          </p>
        </Card>

        {solveMutation.data ? (
          <Card className="space-y-3 border-emerald-200 bg-emerald-50/60">
            <div className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Resultado de la ultima corrida ({solveMutation.data.run.status})
            </div>
            <p className="text-sm text-slate-700">Run ID: {solveMutation.data.run.id}</p>
            <p className="text-sm text-slate-700">Ejecutada: {formatIso(solveMutation.data.run.executedAt)}</p>
            <p className="text-sm text-slate-700">Factible: {latestResult?.isFeasible ? 'si' : 'no'}</p>
            <p className="text-sm text-slate-700">Asignaciones: {latestResult?.assignedCount ?? 0}</p>
            <p className="text-sm text-slate-700">
              Dias sin cubrir:{' '}
              {latestResult && latestResult.uncoveredDays.length > 0 ? latestResult.uncoveredDays.join(', ') : 'ninguno'}
            </p>

            <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Dia</th>
                    <th className="px-3 py-2">Medicos asignados</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentsByDay.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={2}>
                        Sin asignaciones en la corrida.
                      </td>
                    </tr>
                  ) : (
                    assignmentsByDay.map((row) => (
                      <tr key={row.dayId} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-800">{row.dayId}</td>
                        <td className="px-3 py-2 text-slate-700">{row.assignments.join(', ')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Disponibilidad registrada</h2>
          <div className="mt-3 overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Doctor</th>
                  <th className="px-3 py-2">Periodo</th>
                  <th className="px-3 py-2">Dia</th>
                  <th className="px-3 py-2">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {!availabilityQuery.data || availabilityQuery.data.items.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={4}>
                      Sin disponibilidad cargada.
                    </td>
                  </tr>
                ) : (
                  availabilityQuery.data.items.map((entry) => (
                    <tr key={`${entry.doctorId}:${entry.periodId}:${entry.dayId}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{entry.doctorId}</td>
                      <td className="px-3 py-2 text-slate-700">{entry.periodId}</td>
                      <td className="px-3 py-2 text-slate-700">{entry.dayId}</td>
                      <td className="px-3 py-2 text-slate-700">{entry.source}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Historial de corridas</h2>
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              onClick={() => historyQuery.refetch()}
              disabled={sprintId.trim().length === 0 || historyQuery.isFetching}
              aria-label="Cargar historial"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Historial
            </Button>
          </div>
          <div className="mt-3 overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Run ID</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Ejecutada</th>
                </tr>
              </thead>
              <tbody>
                {!historyQuery.data || historyQuery.data.items.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={3}>
                      Sin corridas cargadas.
                    </td>
                  </tr>
                ) : (
                  historyQuery.data.items.map((run) => (
                    <tr key={run.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{run.id}</td>
                      <td className="px-3 py-2 text-slate-700">{run.status}</td>
                      <td className="px-3 py-2 text-slate-700">{formatIso(run.executedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default App;
