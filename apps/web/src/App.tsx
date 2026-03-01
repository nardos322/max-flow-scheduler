import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Play, RefreshCcw, Shield, TriangleAlert, UserRoundCog, Users } from 'lucide-react';
import { Button } from './components/ui/button.js';
import { Card } from './components/ui/card.js';
import {
  addSprintToCycle,
  createPlanningCycle,
  getPlanningCycle,
  getSprint,
  listPlanningCycleRuns,
  listPlanningCycles,
  listSprintAvailability,
  listSprintRuns,
  listSprints,
  markSprintReady,
  runPlanningCycle,
  runSprintSolve,
  setDoctorAvailability,
  setPlannerOverrideAvailability,
} from './lib/api.js';

type StepStatus = 'pending' | 'active' | 'done';

type FlowStep = {
  id: string;
  label: string;
  hint: string;
  status: StepStatus;
};

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

function statusBadgeClass(status: string): string {
  if (status === 'ready-to-solve') {
    return 'border-amber-300 bg-amber-100 text-amber-800';
  }
  if (status === 'solved') {
    return 'border-emerald-300 bg-emerald-100 text-emerald-800';
  }
  return 'border-slate-300 bg-slate-100 text-slate-700';
}

function stepClass(status: StepStatus): string {
  if (status === 'done') {
    return 'border-emerald-300 bg-emerald-100 text-emerald-800';
  }
  if (status === 'active') {
    return 'border-amber-300 bg-amber-100 text-amber-800';
  }
  return 'border-slate-300 bg-slate-100 text-slate-700';
}

function cycleStatusBadgeClass(status: string): string {
  if (status === 'succeeded') {
    return 'border-emerald-300 bg-emerald-100 text-emerald-800';
  }
  if (status === 'partial-failed') {
    return 'border-amber-300 bg-amber-100 text-amber-800';
  }
  return 'border-red-300 bg-red-100 text-red-800';
}

export function App() {
  const [token, setToken] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [doctorPeriodId, setDoctorPeriodId] = useState('');
  const [doctorDays, setDoctorDays] = useState('');
  const [overrideDoctorId, setOverrideDoctorId] = useState('');
  const [overridePeriodId, setOverridePeriodId] = useState('');
  const [overrideDays, setOverrideDays] = useState('');
  const [lastActionMessage, setLastActionMessage] = useState('');

  const [cycleName, setCycleName] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [cycleSprintId, setCycleSprintId] = useState('');

  const [cycles, setCycles] = useState<Awaited<ReturnType<typeof listPlanningCycles>>['items']>([]);
  const [cyclesNextCursor, setCyclesNextCursor] = useState<string | undefined>(undefined);

  const [cycleRuns, setCycleRuns] = useState<Awaited<ReturnType<typeof listPlanningCycleRuns>>['items']>([]);
  const [cycleRunsNextCursor, setCycleRunsNextCursor] = useState<string | undefined>(undefined);

  const [sprintCatalog, setSprintCatalog] = useState<Awaited<ReturnType<typeof listSprints>>['items']>([]);
  const [sprintCatalogNextCursor, setSprintCatalogNextCursor] = useState<string | undefined>(undefined);

  const [sprintRuns, setSprintRuns] = useState<Awaited<ReturnType<typeof listSprintRuns>>['items']>([]);
  const [sprintRunsNextCursor, setSprintRunsNextCursor] = useState<string | undefined>(undefined);

  const cyclesQuery = useQuery({
    queryKey: ['planning-cycles', token],
    queryFn: () => listPlanningCycles(token, { limit: 20 }),
    enabled: false,
    retry: false,
  });

  const cycleDetailQuery = useQuery({
    queryKey: ['planning-cycle', selectedCycleId, token],
    queryFn: () => getPlanningCycle(token, selectedCycleId),
    enabled: selectedCycleId.trim().length > 0,
    retry: false,
  });

  const cycleRunsQuery = useQuery({
    queryKey: ['planning-cycle-runs', selectedCycleId, token],
    queryFn: () => listPlanningCycleRuns(token, selectedCycleId, { limit: 20 }),
    enabled: selectedCycleId.trim().length > 0,
    retry: false,
  });

  const sprintsQuery = useQuery({
    queryKey: ['sprints', token],
    queryFn: () => listSprints(token, { limit: 20 }),
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

  const sprintRunsQuery = useQuery({
    queryKey: ['sprint-runs', sprintId, token],
    queryFn: () => listSprintRuns(sprintId, token, { limit: 20 }),
    enabled: false,
    retry: false,
  });

  useEffect(() => {
    if (cyclesQuery.data) {
      setCycles(cyclesQuery.data.items);
      setCyclesNextCursor(cyclesQuery.data.nextCursor);
    }
  }, [cyclesQuery.data]);

  useEffect(() => {
    if (cycleRunsQuery.data) {
      setCycleRuns(cycleRunsQuery.data.items);
      setCycleRunsNextCursor(cycleRunsQuery.data.nextCursor);
    }
  }, [cycleRunsQuery.data]);

  useEffect(() => {
    if (sprintsQuery.data) {
      setSprintCatalog(sprintsQuery.data.items);
      setSprintCatalogNextCursor(sprintsQuery.data.nextCursor);
    }
  }, [sprintsQuery.data]);

  useEffect(() => {
    if (sprintRunsQuery.data) {
      setSprintRuns(sprintRunsQuery.data.items);
      setSprintRunsNextCursor(sprintRunsQuery.data.nextCursor);
    }
  }, [sprintRunsQuery.data]);

  useEffect(() => {
    if (cycleDetailQuery.data?.sprintIds.length && sprintId.trim().length === 0) {
      const firstSprintId = cycleDetailQuery.data.sprintIds[0];
      if (firstSprintId) {
        setSprintId(firstSprintId);
      }
    }
  }, [cycleDetailQuery.data, sprintId]);

  const loadMoreCyclesMutation = useMutation({
    mutationFn: () => {
      if (!cyclesNextCursor) {
        return Promise.resolve(null);
      }
      return listPlanningCycles(token, { cursor: cyclesNextCursor, limit: 20 });
    },
    onSuccess: (payload) => {
      if (!payload) {
        return;
      }
      setCycles((prev) => {
        const existing = new Set(prev.map((item) => item.id));
        const merged = [...prev];
        for (const item of payload.items) {
          if (!existing.has(item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });
      setCyclesNextCursor(payload.nextCursor);
    },
  });

  const loadMoreSprintsMutation = useMutation({
    mutationFn: () => {
      if (!sprintCatalogNextCursor) {
        return Promise.resolve(null);
      }
      return listSprints(token, { cursor: sprintCatalogNextCursor, limit: 20 });
    },
    onSuccess: (payload) => {
      if (!payload) {
        return;
      }
      setSprintCatalog((prev) => {
        const existing = new Set(prev.map((item) => item.id));
        const merged = [...prev];
        for (const item of payload.items) {
          if (!existing.has(item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });
      setSprintCatalogNextCursor(payload.nextCursor);
    },
  });

  const loadMoreCycleRunsMutation = useMutation({
    mutationFn: () => {
      if (!selectedCycleId || !cycleRunsNextCursor) {
        return Promise.resolve(null);
      }
      return listPlanningCycleRuns(token, selectedCycleId, { cursor: cycleRunsNextCursor, limit: 20 });
    },
    onSuccess: (payload) => {
      if (!payload) {
        return;
      }
      setCycleRuns((prev) => {
        const existing = new Set(prev.map((item) => item.id));
        const merged = [...prev];
        for (const item of payload.items) {
          if (!existing.has(item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });
      setCycleRunsNextCursor(payload.nextCursor);
    },
  });

  const loadMoreSprintRunsMutation = useMutation({
    mutationFn: () => {
      if (!sprintId || !sprintRunsNextCursor) {
        return Promise.resolve(null);
      }
      return listSprintRuns(sprintId, token, { cursor: sprintRunsNextCursor, limit: 20 });
    },
    onSuccess: (payload) => {
      if (!payload) {
        return;
      }
      setSprintRuns((prev) => {
        const existing = new Set(prev.map((item) => item.id));
        const merged = [...prev];
        for (const item of payload.items) {
          if (!existing.has(item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });
      setSprintRunsNextCursor(payload.nextCursor);
    },
  });

  const createCycleMutation = useMutation({
    mutationFn: () => createPlanningCycle(token, cycleName.trim()),
    onSuccess: async (cycle) => {
      setLastActionMessage(`Ciclo ${cycle.name} creado.`);
      setCycleName('');
      setSelectedCycleId(cycle.id);
      await cyclesQuery.refetch();
    },
  });

  const addSprintToCycleMutation = useMutation({
    mutationFn: () => addSprintToCycle(token, selectedCycleId, cycleSprintId.trim()),
    onSuccess: async () => {
      setLastActionMessage('Sprint agregado al ciclo.');
      setCycleSprintId('');
      await Promise.all([cycleDetailQuery.refetch(), cyclesQuery.refetch()]);
    },
  });

  const runCycleMutation = useMutation({
    mutationFn: () => runPlanningCycle(token, selectedCycleId),
    onSuccess: async (result) => {
      setLastActionMessage(`Corrida del ciclo ejecutada (${result.status}).`);
      await Promise.all([cycleRunsQuery.refetch(), cycleDetailQuery.refetch()]);
    },
  });

  const solveMutation = useMutation({
    mutationFn: () => runSprintSolve(sprintId, token),
    onSuccess: async () => {
      setLastActionMessage('Corrida ejecutada. Se refrescaron sprint, disponibilidad e historial.');
      await Promise.all([sprintRunsQuery.refetch(), availabilityQuery.refetch(), sprintQuery.refetch()]);
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
      setLastActionMessage('Disponibilidad del medico guardada correctamente.');
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
      setLastActionMessage('Override del planificador guardado correctamente.');
      await Promise.all([availabilityQuery.refetch(), sprintQuery.refetch()]);
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: () => markSprintReady(sprintId, token),
    onSuccess: async () => {
      setLastActionMessage('Sprint marcado como ready-to-solve.');
      await Promise.all([sprintQuery.refetch(), availabilityQuery.refetch(), sprintRunsQuery.refetch()]);
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
    (cyclesQuery.error as Error | null)?.message ??
    (cycleDetailQuery.error as Error | null)?.message ??
    (cycleRunsQuery.error as Error | null)?.message ??
    (sprintsQuery.error as Error | null)?.message ??
    (createCycleMutation.error as Error | null)?.message ??
    (addSprintToCycleMutation.error as Error | null)?.message ??
    (runCycleMutation.error as Error | null)?.message ??
    (solveMutation.error as Error | null)?.message ??
    (sprintRunsQuery.error as Error | null)?.message ??
    (sprintQuery.error as Error | null)?.message ??
    (availabilityQuery.error as Error | null)?.message ??
    (setDoctorAvailabilityMutation.error as Error | null)?.message ??
    (setOverrideAvailabilityMutation.error as Error | null)?.message ??
    (markReadyMutation.error as Error | null)?.message;

  const hasSprintLoaded = Boolean(sprintQuery.data);
  const hasAvailability =
    (availabilityQuery.data?.items.length ?? 0) > 0 || (sprintQuery.data?.availability.length ?? 0) > 0;
  const isReadyToRun = sprintQuery.data?.status === 'ready-to-solve' || sprintQuery.data?.status === 'solved';
  const parsedDoctorDays = parseDayIds(doctorDays);
  const parsedOverrideDays = parseDayIds(overrideDays);
  const availabilityTotal = availabilityQuery.data?.items.length ?? sprintQuery.data?.availability.length ?? 0;
  const runHistoryTotal = sprintRuns.length;

  const canRun = sprintId.trim().length > 0 && hasSprintLoaded && isReadyToRun;
  const canMarkReady = sprintId.trim().length > 0 && hasSprintLoaded && !isReadyToRun && !markReadyMutation.isPending;
  const canSetDoctorAvailability =
    sprintId.trim().length > 0 && doctorId.trim().length > 0 && doctorPeriodId.trim().length > 0;
  const canSetOverrideAvailability =
    sprintId.trim().length > 0 && overrideDoctorId.trim().length > 0 && overridePeriodId.trim().length > 0;
  const canLoadAll = sprintId.trim().length > 0;

  const canCreateCycle = token.trim().length > 0 && cycleName.trim().length > 0;
  const canAddSprintToCycle = selectedCycleId.trim().length > 0 && cycleSprintId.trim().length > 0;
  const canRunCycle = selectedCycleId.trim().length > 0;

  const flowSteps: FlowStep[] = [
    {
      id: 'load-sprint',
      label: 'Cargar sprint',
      hint: hasSprintLoaded ? 'Sprint cargado' : 'Pendiente',
      status: hasSprintLoaded ? 'done' : 'active',
    },
    {
      id: 'load-availability',
      label: 'Cargar disponibilidad',
      hint: hasAvailability ? `${availabilityTotal} dias cargados` : 'Pendiente',
      status: hasAvailability ? 'done' : hasSprintLoaded ? 'active' : 'pending',
    },
    {
      id: 'mark-ready',
      label: 'Marcar ready',
      hint: isReadyToRun ? 'Estado listo' : 'Pendiente',
      status: isReadyToRun ? 'done' : hasSprintLoaded && hasAvailability ? 'active' : 'pending',
    },
    {
      id: 'run-solver',
      label: 'Ejecutar corrida',
      hint: solveMutation.data ? 'Ultima corrida registrada' : 'Pendiente',
      status: solveMutation.data ? 'done' : isReadyToRun ? 'active' : 'pending',
    },
  ];

  const latestCycleRun = runCycleMutation.data ?? cycleRuns[0];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff4dd_0%,#fffdfa_38%,#f8fafc_100%)] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <h1 className="text-3xl font-black tracking-tight">Planning Cycle Console</h1>
          <p className="mt-2 text-sm text-slate-600">
            Flujo MVP ciclo-first: crea ciclo, agrega sprints y ejecuta corridas por lote. La consola de sprint queda disponible para operacion puntual.
          </p>
        </Card>

        <Card className="space-y-4 border-indigo-200 bg-indigo-50/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-800">Ciclos de planificacion</h2>
          <div className="grid gap-3 md:grid-cols-[2fr_2fr_auto_auto] md:items-end">
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

            <label className="text-sm text-slate-700">
              Nombre de ciclo
              <input
                aria-label="Nombre de ciclo"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Q2 guardias"
                value={cycleName}
                onChange={(event) => setCycleName(event.target.value)}
              />
            </label>

            <Button
              variant="outline"
              onClick={() => cyclesQuery.refetch()}
              disabled={token.trim().length === 0 || cyclesQuery.isFetching}
              aria-label="Cargar ciclos"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Cargar ciclos
            </Button>

            <Button
              onClick={() => createCycleMutation.mutate()}
              disabled={!canCreateCycle || createCycleMutation.isPending}
              aria-label="Crear ciclo"
            >
              {createCycleMutation.isPending ? 'Creando...' : 'Crear ciclo'}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-md border border-indigo-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-800">Listado de ciclos</h3>
              <div className="space-y-2">
                {cycles.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin ciclos cargados.</p>
                ) : (
                  cycles.map((cycle) => (
                    <button
                      key={cycle.id}
                      type="button"
                      className={`w-full rounded-md border px-3 py-2 text-left text-xs ${
                        selectedCycleId === cycle.id
                          ? 'border-indigo-400 bg-indigo-100 text-indigo-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                      onClick={() => setSelectedCycleId(cycle.id)}
                    >
                      <p className="font-semibold">{cycle.name}</p>
                      <p className="mt-1">{cycle.id}</p>
                      <p className="mt-1">Sprints: {cycle.sprintIds.length}</p>
                    </button>
                  ))
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => loadMoreCyclesMutation.mutate()}
                disabled={!cyclesNextCursor || loadMoreCyclesMutation.isPending}
                aria-label="Cargar mas ciclos"
              >
                {loadMoreCyclesMutation.isPending ? 'Cargando...' : 'Cargar mas ciclos'}
              </Button>
            </div>

            <div className="space-y-3 rounded-md border border-indigo-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-800">Ciclo seleccionado</h3>
              {!cycleDetailQuery.data ? (
                <p className="text-xs text-slate-500">Selecciona un ciclo para ver detalle.</p>
              ) : (
                <>
                  <p className="text-sm text-slate-700">Nombre: {cycleDetailQuery.data.name}</p>
                  <p className="text-sm text-slate-700">Estado: {cycleDetailQuery.data.status}</p>
                  <p className="text-sm text-slate-700">
                    Sprints: {cycleDetailQuery.data.sprintIds.length > 0 ? cycleDetailQuery.data.sprintIds.join(', ') : 'ninguno'}
                  </p>
                </>
              )}

              <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
                <label className="text-sm text-slate-700">
                  Sprint ID a agregar
                  <input
                    aria-label="Sprint ID ciclo"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="sprint-1"
                    value={cycleSprintId}
                    onChange={(event) => setCycleSprintId(event.target.value)}
                  />
                </label>
                <Button
                  variant="outline"
                  onClick={() => addSprintToCycleMutation.mutate()}
                  disabled={!canAddSprintToCycle || addSprintToCycleMutation.isPending}
                  aria-label="Agregar sprint al ciclo"
                >
                  {addSprintToCycleMutation.isPending ? 'Agregando...' : 'Agregar sprint'}
                </Button>
              </div>

              <Button
                onClick={() => runCycleMutation.mutate()}
                disabled={!canRunCycle || runCycleMutation.isPending}
                aria-label="Ejecutar ciclo"
              >
                <Play className="mr-2 h-4 w-4" /> {runCycleMutation.isPending ? 'Ejecutando...' : 'Ejecutar ciclo'}
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-indigo-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Historial de corridas de ciclo</h3>
              <Button
                variant="outline"
                onClick={() => cycleRunsQuery.refetch()}
                disabled={selectedCycleId.trim().length === 0 || cycleRunsQuery.isFetching}
                aria-label="Cargar corridas de ciclo"
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Corridas ciclo
              </Button>
            </div>
            {latestCycleRun ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                <p className="font-semibold">Ultima corrida</p>
                <p>ID: {latestCycleRun.id}</p>
                <p>
                  Estado:{' '}
                  <span className={`rounded-full border px-2 py-0.5 ${cycleStatusBadgeClass(latestCycleRun.status)}`}>
                    {latestCycleRun.status}
                  </span>
                </p>
              </div>
            ) : null}
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Run ID</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {cycleRuns.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={3}>
                        Sin corridas de ciclo cargadas.
                      </td>
                    </tr>
                  ) : (
                    cycleRuns.map((run) => (
                      <tr key={run.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-800">{run.id}</td>
                        <td className="px-3 py-2 text-slate-700">{run.status}</td>
                        <td className="px-3 py-2 text-slate-700">{run.items.length}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Button
              variant="outline"
              onClick={() => loadMoreCycleRunsMutation.mutate()}
              disabled={!cycleRunsNextCursor || loadMoreCycleRunsMutation.isPending}
              aria-label="Cargar mas corridas de ciclo"
            >
              {loadMoreCycleRunsMutation.isPending ? 'Cargando...' : 'Cargar mas corridas de ciclo'}
            </Button>
          </div>

          <div className="space-y-2 rounded-md border border-indigo-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Catalogo de sprints</h3>
              <Button
                variant="outline"
                onClick={() => sprintsQuery.refetch()}
                disabled={token.trim().length === 0 || sprintsQuery.isFetching}
                aria-label="Cargar sprints"
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Cargar sprints
              </Button>
            </div>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Sprint ID</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {sprintCatalog.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={3}>
                        Sin sprints cargados.
                      </td>
                    </tr>
                  ) : (
                    sprintCatalog.map((sprint) => (
                      <tr key={sprint.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-800">{sprint.id}</td>
                        <td className="px-3 py-2 text-slate-700">{sprint.status}</td>
                        <td className="px-3 py-2">
                          <Button
                            variant="outline"
                            onClick={() => setSprintId(sprint.id)}
                            aria-label={`Seleccionar sprint ${sprint.id}`}
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Button
              variant="outline"
              onClick={() => loadMoreSprintsMutation.mutate()}
              disabled={!sprintCatalogNextCursor || loadMoreSprintsMutation.isPending}
              aria-label="Cargar mas sprints"
            >
              {loadMoreSprintsMutation.isPending ? 'Cargando...' : 'Cargar mas sprints'}
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto_auto] md:items-end">
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
              onClick={() => {
                void Promise.all([sprintQuery.refetch(), availabilityQuery.refetch(), sprintRunsQuery.refetch()]);
              }}
              disabled={!canLoadAll || sprintQuery.isFetching || availabilityQuery.isFetching || sprintRunsQuery.isFetching}
              aria-label="Refrescar todo"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Refrescar todo
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

          <div className="grid gap-2 md:grid-cols-4">
            {flowSteps.map((step, index) => (
              <div key={step.id} className={`rounded-md border px-3 py-2 text-xs ${stepClass(step.status)}`}>
                <p className="font-semibold uppercase tracking-wide">
                  {index + 1}. {step.label}
                </p>
                <p className="mt-1">{step.hint}</p>
              </div>
            ))}
          </div>

          {token.trim().length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5" />
              Pega un JWT valido emitido por tu IdP. Solo en desarrollo local puedes usar <code>/auth/dev/token</code>.
            </p>
          ) : null}

          {lastActionMessage ? (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {lastActionMessage}
            </div>
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
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-slate-700">Estado:</p>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(sprintQuery.data.status)}`}>
                {sprintQuery.data.status}
              </span>
            </div>
            <p className="text-sm text-slate-700">Periodo: {sprintQuery.data.periodId}</p>
            <p className="text-sm text-slate-700">
              Medicos: {sprintQuery.data.doctorIds.length > 0 ? sprintQuery.data.doctorIds.join(', ') : 'ninguno'}
            </p>
            <div className="grid gap-2 pt-1 md:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <p className="uppercase tracking-wide text-slate-500">Medicos en sprint</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{sprintQuery.data.doctorIds.length}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <p className="uppercase tracking-wide text-slate-500">Dias disponibles</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{availabilityTotal}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <p className="uppercase tracking-wide text-slate-500">Corridas registradas</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{runHistoryTotal}</p>
              </div>
            </div>
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
              <p className="text-xs text-slate-500">Se parsean {parsedDoctorDays.length} dias unicos para guardar.</p>
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
              <p className="text-xs text-slate-500">Se parsean {parsedOverrideDays.length} dias unicos para guardar.</p>
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
              Dias sin cubrir: {latestResult && latestResult.uncoveredDays.length > 0 ? latestResult.uncoveredDays.join(', ') : 'ninguno'}
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
          <div className="mt-3 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => sprintRunsQuery.refetch()}
              disabled={sprintId.trim().length === 0 || sprintRunsQuery.isFetching}
              aria-label="Cargar historial"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Historial
            </Button>
            <Button
              variant="outline"
              onClick={() => loadMoreSprintRunsMutation.mutate()}
              disabled={!sprintRunsNextCursor || loadMoreSprintRunsMutation.isPending}
              aria-label="Cargar mas historial"
            >
              {loadMoreSprintRunsMutation.isPending ? 'Cargando...' : 'Cargar mas'}
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
                {sprintRuns.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={3}>
                      Sin corridas cargadas.
                    </td>
                  </tr>
                ) : (
                  sprintRuns.map((run) => (
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
