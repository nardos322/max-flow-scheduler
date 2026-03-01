import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Play, RefreshCcw, Shield, TriangleAlert } from 'lucide-react';
import { solveResponseSchema, sprintRunSchema } from '@scheduler/domain';
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

type RunSolveResponse = z.infer<typeof runSolveResponseSchema>;
type SprintRunListResponse = z.infer<typeof sprintRunListResponseSchema>;

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

function formatIso(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

export function App() {
  const [sprintId, setSprintId] = useState('');
  const [token, setToken] = useState('');

  const historyQuery = useQuery({
    queryKey: ['sprint-runs', sprintId, token],
    queryFn: () => listSprintRuns(sprintId, token),
    enabled: false,
    retry: false,
  });

  const solveMutation = useMutation({
    mutationFn: () => runSprintSolve(sprintId, token),
    onSuccess: async () => {
      await historyQuery.refetch();
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

  const canRun = sprintId.trim().length > 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff4dd_0%,#fffdfa_38%,#f8fafc_100%)] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <h1 className="text-3xl font-black tracking-tight">Sprint Run Console</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ejecuta corridas del solver por sprint y visualiza asignaciones por dia usando la API operativa.
          </p>
        </Card>

        <Card className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto_auto] md:items-end">
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
              onClick={() => historyQuery.refetch()}
              disabled={!canRun || historyQuery.isFetching}
              aria-label="Cargar historial"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Historial
            </Button>

            <Button onClick={() => solveMutation.mutate()} disabled={!canRun || solveMutation.isPending} aria-label="Ejecutar corrida">
              <Play className="mr-2 h-4 w-4" />
              {solveMutation.isPending ? 'Ejecutando...' : 'Ejecutar corrida'}
            </Button>
          </div>

          {token.trim().length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5" />
              Si la API requiere auth, pega un JWT valido. En dev puedes usar <code>/auth/dev/token</code>.
            </p>
          ) : null}

          {(solveMutation.isError || historyQuery.isError) && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              <TriangleAlert className="h-4 w-4" />
              {(solveMutation.error as Error | null)?.message ?? (historyQuery.error as Error | null)?.message}
            </div>
          )}
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Historial de corridas</h2>
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
