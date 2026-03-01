import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.js';

function renderApp() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders sprint run console', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Sprint Run Console' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ejecutar corrida' })).toBeInTheDocument();
  });

  it('blocks run until sprint id is provided', () => {
    renderApp();

    expect(screen.getByRole('button', { name: 'Ejecutar corrida' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cargar historial' })).toBeDisabled();
  });

  it('runs sprint solve and renders assignment rows by day', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);

      if (url.endsWith('/sprints/sprint-1/runs') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            run: {
              id: 'run-1',
              sprintId: 'sprint-1',
              executedAt: '2026-03-01T10:00:00.000Z',
              status: 'succeeded',
              inputSnapshot: {
                contractVersion: '1.0',
                doctors: [{ id: 'd1', maxTotalDays: 2 }],
                periods: [{ id: 'p1', dayIds: ['2026-03-02'] }],
                demands: [{ dayId: '2026-03-02', requiredDoctors: 1 }],
                availability: [{ doctorId: 'd1', periodId: 'p1', dayId: '2026-03-02' }],
              },
              outputSnapshot: {
                contractVersion: '1.0',
                isFeasible: true,
                assignedCount: 1,
                uncoveredDays: [],
                assignments: [{ doctorId: 'd1', periodId: 'p1', dayId: '2026-03-02' }],
              },
            },
            result: {
              contractVersion: '1.0',
              isFeasible: true,
              assignedCount: 1,
              uncoveredDays: [],
              assignments: [{ doctorId: 'd1', periodId: 'p1', dayId: '2026-03-02' }],
            },
          }),
        } as Response;
      }

      if (url.endsWith('/sprints/sprint-1/runs') && init?.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            items: [
              {
                id: 'run-1',
                sprintId: 'sprint-1',
                executedAt: '2026-03-01T10:00:00.000Z',
                status: 'succeeded',
                inputSnapshot: {
                  contractVersion: '1.0',
                  doctors: [{ id: 'd1', maxTotalDays: 2 }],
                  periods: [{ id: 'p1', dayIds: ['2026-03-02'] }],
                  demands: [{ dayId: '2026-03-02', requiredDoctors: 1 }],
                  availability: [{ doctorId: 'd1', periodId: 'p1', dayId: '2026-03-02' }],
                },
              },
            ],
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    renderApp();

    fireEvent.change(screen.getByLabelText('Sprint ID'), { target: { value: 'sprint-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ejecutar corrida' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/sprints/sprint-1/runs'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(screen.getByText('Resultado de la ultima corrida (succeeded)')).toBeInTheDocument();
    expect(screen.getByText('2026-03-02')).toBeInTheDocument();
    expect(screen.getByText('d1')).toBeInTheDocument();
  }, 10000);
});
