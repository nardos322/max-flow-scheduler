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
    expect(screen.getByRole('button', { name: 'Guardar disponibilidad medico' })).toBeInTheDocument();
  });

  it('blocks run until sprint id is provided', () => {
    renderApp();

    expect(screen.getByRole('button', { name: 'Ejecutar corrida' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cargar historial' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cargar disponibilidad' })).toBeDisabled();
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

      if (url.endsWith('/sprints/sprint-1/availability') && init?.method === 'GET') {
        return {
          ok: true,
          json: async () => ({ items: [] }),
        } as Response;
      }

      if (url.endsWith('/sprints/sprint-1') && init?.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            id: 'sprint-1',
            name: 'Sprint 1',
            periodId: 'p1',
            status: 'draft',
            globalConfig: {
              requiredDoctorsPerShift: 1,
              maxDaysPerDoctorDefault: 2,
            },
            doctorIds: ['d1'],
            availability: [],
            createdAt: '2026-03-01T09:00:00.000Z',
            updatedAt: '2026-03-01T09:00:00.000Z',
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

  it('saves doctor self-service availability and refreshes table', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);

      if (url.endsWith('/sprints/sprint-1/doctors/doc-1/availability') && init?.method === 'PUT') {
        return {
          ok: true,
          json: async () => ({
            id: 'sprint-1',
            name: 'Sprint 1',
            periodId: 'p1',
            status: 'draft',
            globalConfig: {
              requiredDoctorsPerShift: 1,
              maxDaysPerDoctorDefault: 2,
            },
            doctorIds: ['doc-1'],
            availability: [
              {
                doctorId: 'doc-1',
                periodId: 'p1',
                dayId: '2026-03-02',
                source: 'doctor-self-service',
                updatedByUserId: 'doc-1',
                updatedByRole: 'doctor',
                updatedAt: '2026-03-01T11:00:00.000Z',
              },
            ],
            createdAt: '2026-03-01T09:00:00.000Z',
            updatedAt: '2026-03-01T11:00:00.000Z',
          }),
        } as Response;
      }

      if (url.endsWith('/sprints/sprint-1/availability') && init?.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            items: [
              {
                doctorId: 'doc-1',
                periodId: 'p1',
                dayId: '2026-03-02',
                source: 'doctor-self-service',
                updatedByUserId: 'doc-1',
                updatedByRole: 'doctor',
                updatedAt: '2026-03-01T11:00:00.000Z',
              },
            ],
          }),
        } as Response;
      }

      if (url.endsWith('/sprints/sprint-1') && init?.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            id: 'sprint-1',
            name: 'Sprint 1',
            periodId: 'p1',
            status: 'draft',
            globalConfig: {
              requiredDoctorsPerShift: 1,
              maxDaysPerDoctorDefault: 2,
            },
            doctorIds: ['doc-1'],
            availability: [
              {
                doctorId: 'doc-1',
                periodId: 'p1',
                dayId: '2026-03-02',
                source: 'doctor-self-service',
                updatedByUserId: 'doc-1',
                updatedByRole: 'doctor',
                updatedAt: '2026-03-01T11:00:00.000Z',
              },
            ],
            createdAt: '2026-03-01T09:00:00.000Z',
            updatedAt: '2026-03-01T11:00:00.000Z',
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    renderApp();

    fireEvent.change(screen.getByLabelText('Sprint ID'), { target: { value: 'sprint-1' } });
    fireEvent.change(screen.getByLabelText('Doctor ID autogestion'), { target: { value: 'doc-1' } });
    fireEvent.change(screen.getByLabelText('Period ID autogestion'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText('Dias autogestion'), { target: { value: '2026-03-02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar disponibilidad medico' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/sprints/sprint-1/doctors/doc-1/availability'),
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    expect(screen.getByText('doctor-self-service')).toBeInTheDocument();
    expect(screen.getByText('doc-1')).toBeInTheDocument();
    expect(screen.getAllByText('2026-03-02').length).toBeGreaterThan(0);
  }, 10000);

  it('saves planner override availability and refreshes table', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);

      if (url.endsWith('/sprints/sprint-1/availability/override') && init?.method === 'PUT') {
        return {
          ok: true,
          json: async () => ({
            id: 'sprint-1',
            name: 'Sprint 1',
            periodId: 'p1',
            status: 'draft',
            globalConfig: {
              requiredDoctorsPerShift: 1,
              maxDaysPerDoctorDefault: 2,
            },
            doctorIds: ['doc-2'],
            availability: [
              {
                doctorId: 'doc-2',
                periodId: 'p1',
                dayId: '2026-03-04',
                source: 'planner-override',
                updatedByUserId: 'planner-1',
                updatedByRole: 'planner',
                updatedAt: '2026-03-01T12:00:00.000Z',
              },
            ],
            createdAt: '2026-03-01T09:00:00.000Z',
            updatedAt: '2026-03-01T12:00:00.000Z',
          }),
        } as Response;
      }

      if (url.endsWith('/sprints/sprint-1/availability') && init?.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            items: [
              {
                doctorId: 'doc-2',
                periodId: 'p1',
                dayId: '2026-03-04',
                source: 'planner-override',
                updatedByUserId: 'planner-1',
                updatedByRole: 'planner',
                updatedAt: '2026-03-01T12:00:00.000Z',
              },
            ],
          }),
        } as Response;
      }

      if (url.endsWith('/sprints/sprint-1') && init?.method === 'GET') {
        return {
          ok: true,
          json: async () => ({
            id: 'sprint-1',
            name: 'Sprint 1',
            periodId: 'p1',
            status: 'draft',
            globalConfig: {
              requiredDoctorsPerShift: 1,
              maxDaysPerDoctorDefault: 2,
            },
            doctorIds: ['doc-2'],
            availability: [
              {
                doctorId: 'doc-2',
                periodId: 'p1',
                dayId: '2026-03-04',
                source: 'planner-override',
                updatedByUserId: 'planner-1',
                updatedByRole: 'planner',
                updatedAt: '2026-03-01T12:00:00.000Z',
              },
            ],
            createdAt: '2026-03-01T09:00:00.000Z',
            updatedAt: '2026-03-01T12:00:00.000Z',
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    renderApp();

    fireEvent.change(screen.getByLabelText('Sprint ID'), { target: { value: 'sprint-1' } });
    fireEvent.change(screen.getByLabelText('Doctor ID override'), { target: { value: 'doc-2' } });
    fireEvent.change(screen.getByLabelText('Period ID override'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText('Dias override'), { target: { value: '2026-03-04' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar override planificador' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/sprints/sprint-1/availability/override'),
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    expect(screen.getByText('planner-override')).toBeInTheDocument();
    expect(screen.getByText('doc-2')).toBeInTheDocument();
    expect(screen.getAllByText('2026-03-04').length).toBeGreaterThan(0);
  }, 10000);
});
