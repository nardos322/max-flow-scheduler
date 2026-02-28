import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Plus, TriangleAlert, X } from 'lucide-react';
import { solveRequestSchema, type SolveRequest, type SolveResponse } from '@scheduler/domain';
import { Button } from './components/ui/button.js';
import { Card } from './components/ui/card.js';

type EditableDoctor = {
  id: string;
  maxTotalDays: number;
};

type EditablePeriod = {
  id: string;
  dayIdsText: string;
};

type EditableDemand = {
  dayId: string;
  requiredDoctors: number;
};

type EditableAvailability = {
  doctorId: string;
  periodId: string;
  dayId: string;
};

type ValidationIssue = {
  path: string;
  message: string;
};

type ApiError = {
  error?: string;
  code?: string;
  details?: string;
  requestId?: string;
};

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function toSolveRequest(
  doctors: EditableDoctor[],
  periods: EditablePeriod[],
  demands: EditableDemand[],
  availability: EditableAvailability[],
): SolveRequest {
  return {
    contractVersion: '1.0',
    doctors: doctors.map((doctor) => ({
      id: doctor.id,
      maxTotalDays: doctor.maxTotalDays,
    })),
    periods: periods.map((period) => ({
      id: period.id,
      dayIds: period.dayIdsText
        .split(',')
        .map((day) => day.trim())
        .filter((day) => day.length > 0),
    })),
    demands: demands.map((demand) => ({
      dayId: demand.dayId,
      requiredDoctors: demand.requiredDoctors,
    })),
    availability: availability.map((item) => ({
      doctorId: item.doctorId,
      periodId: item.periodId,
      dayId: item.dayId,
    })),
  };
}

async function solveScenario(payload: SolveRequest): Promise<SolveResponse> {
  const response = await fetch(`${apiBaseUrl}/schedule/solve`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => ({}))) as ApiError;
    const errorMessage = errorPayload.error ?? `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return (await response.json()) as SolveResponse;
}

export function App() {
  const [doctors, setDoctors] = useState<EditableDoctor[]>([{ id: 'd1', maxTotalDays: 2 }]);
  const [periods, setPeriods] = useState<EditablePeriod[]>([{ id: 'p1', dayIdsText: 'day-1,day-2' }]);
  const [demands, setDemands] = useState<EditableDemand[]>([
    { dayId: 'day-1', requiredDoctors: 1 },
    { dayId: 'day-2', requiredDoctors: 1 },
  ]);
  const [availability, setAvailability] = useState<EditableAvailability[]>([
    { doctorId: 'd1', periodId: 'p1', dayId: 'day-1' },
    { doctorId: 'd1', periodId: 'p1', dayId: 'day-2' },
  ]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const draftPayload = useMemo(
    () => toSolveRequest(doctors, periods, demands, availability),
    [doctors, periods, demands, availability],
  );

  const validation = useMemo(() => solveRequestSchema.safeParse(draftPayload), [draftPayload]);

  const issues: ValidationIssue[] = validation.success
    ? []
    : validation.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

  const solveMutation = useMutation({
    mutationFn: solveScenario,
  });

  const onSolve = () => {
    setAttemptedSubmit(true);
    if (!validation.success) {
      return;
    }

    solveMutation.mutate(validation.data);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e8fff3_0%,#f8fffb_45%,#f9fafb_100%)] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Card className="border-brand-100 bg-gradient-to-r from-brand-50 to-white">
          <h1 className="text-3xl font-black tracking-tight">Scenario Editor</h1>
          <p className="mt-2 text-sm text-slate-600">
            Carga medicos, periodos, demanda diaria y disponibilidad. El payload se valida con los schemas
            compartidos antes de ejecutar el solver.
          </p>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Medicos</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDoctors((previous) => [...previous, { id: `d${previous.length + 1}`, maxTotalDays: 1 }])}
              >
                <Plus className="mr-1 h-4 w-4" /> Agregar
              </Button>
            </div>
            {doctors.map((doctor, index) => (
              <div key={`${doctor.id}-${index}`} className="grid grid-cols-[1fr_160px_auto] gap-2">
                <input
                  aria-label={`Doctor id ${index + 1}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={doctor.id}
                  onChange={(event) =>
                    setDoctors((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, id: event.target.value } : item,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`Max days ${index + 1}`}
                  type="number"
                  min={0}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={doctor.maxTotalDays}
                  onChange={(event) =>
                    setDoctors((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, maxTotalDays: Number(event.target.value) } : item,
                      ),
                    )
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Remove doctor ${index + 1}`}
                  onClick={() => setDoctors((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
                  disabled={doctors.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Periodos</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPeriods((previous) => [...previous, { id: `p${previous.length + 1}`, dayIdsText: 'day-1' }])
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Agregar
              </Button>
            </div>
            {periods.map((period, index) => (
              <div key={`${period.id}-${index}`} className="grid grid-cols-[160px_1fr_auto] gap-2">
                <input
                  aria-label={`Period id ${index + 1}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={period.id}
                  onChange={(event) =>
                    setPeriods((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, id: event.target.value } : item,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`Period days ${index + 1}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="day-1,day-2"
                  value={period.dayIdsText}
                  onChange={(event) =>
                    setPeriods((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, dayIdsText: event.target.value } : item,
                      ),
                    )
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Remove period ${index + 1}`}
                  onClick={() => setPeriods((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
                  disabled={periods.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Demanda diaria</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDemands((previous) => [...previous, { dayId: `day-${previous.length + 1}`, requiredDoctors: 1 }])}
              >
                <Plus className="mr-1 h-4 w-4" /> Agregar
              </Button>
            </div>
            {demands.map((demand, index) => (
              <div key={`${demand.dayId}-${index}`} className="grid grid-cols-[1fr_180px_auto] gap-2">
                <input
                  aria-label={`Demand day ${index + 1}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={demand.dayId}
                  onChange={(event) =>
                    setDemands((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, dayId: event.target.value } : item,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`Required doctors ${index + 1}`}
                  type="number"
                  min={1}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={demand.requiredDoctors}
                  onChange={(event) =>
                    setDemands((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, requiredDoctors: Math.max(1, Number(event.target.value)) }
                          : item,
                      ),
                    )
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Remove demand ${index + 1}`}
                  onClick={() => setDemands((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
                  disabled={demands.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Disponibilidad</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setAvailability((previous) => [...previous, { doctorId: 'd1', periodId: 'p1', dayId: 'day-1' }])
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Agregar
              </Button>
            </div>
            {availability.map((item, index) => (
              <div key={`${item.doctorId}-${item.periodId}-${item.dayId}-${index}`} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input
                  aria-label={`Availability doctor ${index + 1}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={item.doctorId}
                  onChange={(event) =>
                    setAvailability((previous) =>
                      previous.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, doctorId: event.target.value } : entry,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`Availability period ${index + 1}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={item.periodId}
                  onChange={(event) =>
                    setAvailability((previous) =>
                      previous.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, periodId: event.target.value } : entry,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`Availability day ${index + 1}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={item.dayId}
                  onChange={(event) =>
                    setAvailability((previous) =>
                      previous.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, dayId: event.target.value } : entry,
                      ),
                    )
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Remove availability ${index + 1}`}
                  onClick={() =>
                    setAvailability((previous) => previous.filter((_, entryIndex) => entryIndex !== index))
                  }
                  disabled={availability.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </Card>
        </div>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Validacion de escenario</h2>
              <p className="text-sm text-slate-600">
                {validation.success ? 'Payload valido para el contrato v1.' : 'Hay errores de validacion en el payload.'}
              </p>
            </div>
            <Button onClick={onSolve} disabled={solveMutation.isPending || !validation.success} aria-label="Resolver escenario">
              {solveMutation.isPending ? 'Resolviendo...' : 'Resolver escenario'}
            </Button>
          </div>

          {!validation.success && (attemptedSubmit || issues.length > 0) ? (
            <ul className="space-y-1 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              {issues.map((issue) => (
                <li key={`${issue.path}-${issue.message}`}>
                  <span className="font-semibold">{issue.path || 'root'}:</span> {issue.message}
                </li>
              ))}
            </ul>
          ) : null}

          {solveMutation.isError ? (
            <div className="flex items-center gap-2 text-sm text-red-700" role="alert">
              <TriangleAlert className="h-4 w-4" />
              {solveMutation.error.message}
            </div>
          ) : null}

          {solveMutation.data ? (
            <div className="rounded-md border border-brand-200 bg-brand-50 p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-brand-700">
                <CheckCircle2 className="h-4 w-4" />
                Resultado del solver
              </div>
              <p className="mt-1 text-slate-700">Feasible: {solveMutation.data.isFeasible ? 'si' : 'no'}</p>
              <p className="text-slate-700">Assigned count: {solveMutation.data.assignedCount}</p>
              <p className="text-slate-700">
                Uncovered days: {solveMutation.data.uncoveredDays.length === 0 ? 'ninguno' : solveMutation.data.uncoveredDays.join(', ')}
              </p>
            </div>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
