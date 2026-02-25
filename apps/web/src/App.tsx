import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, FlaskConical, TriangleAlert } from 'lucide-react';
import { Button } from './components/ui/button.js';
import { Card } from './components/ui/card.js';
import { usePlannerStore } from './store/planner-store.js';

type SolveResult = {
  status: 'ok';
  generatedAt: string;
};

function fakeSolve(): Promise<SolveResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: 'ok', generatedAt: new Date().toISOString() });
    }, 250);
  });
}

export function App() {
  const [lastRun, setLastRun] = useState<string | null>(null);
  const { selectedSprint, requiredDoctors, setSelectedSprint, setRequiredDoctors } = usePlannerStore();

  const solveMutation = useMutation({
    mutationFn: fakeSolve,
    onSuccess: (result) => {
      setLastRun(result.generatedAt);
    },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white p-6 text-slate-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card>
          <h1 className="text-2xl font-bold">Max Flow Scheduler</h1>
          <p className="mt-2 text-sm text-slate-600">
            Stack web base configurado con Tailwind, TanStack Query, Zustand y componentes UI.
          </p>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FlaskConical className="h-4 w-4" />
            Estado local del planificador
          </div>
          <label className="block text-sm">
            Sprint
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={selectedSprint}
              onChange={(event) => setSelectedSprint(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            Medicos requeridos por dia
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={requiredDoctors}
              onChange={(event) => setRequiredDoctors(Number(event.target.value))}
            />
          </label>
          <Button
            onClick={() => solveMutation.mutate()}
            disabled={solveMutation.isPending}
            aria-label="Ejecutar simulacion"
          >
            {solveMutation.isPending ? 'Resolviendo...' : 'Ejecutar simulacion'}
          </Button>
        </Card>

        <Card>
          {solveMutation.isError ? (
            <div className="flex items-center gap-2 text-sm text-red-700">
              <TriangleAlert className="h-4 w-4" />
              Error en simulacion.
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-brand-700">
              <CheckCircle2 className="h-4 w-4" />
              {lastRun ? `Ultima simulacion: ${lastRun}` : 'Sin ejecuciones aun.'}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
