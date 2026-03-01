import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.js';
import { renderWithQueryClient } from './test-utils.js';

function renderApp() {
  return renderWithQueryClient(<App />);
}

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    json: async () => payload,
  } as Response;
}

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders planning cycle console and sprint actions', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Planning Cycle Console' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear ciclo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ejecutar ciclo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ejecutar corrida' })).toBeInTheDocument();
  });

  it('creates a planning cycle and refreshes list', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);

      if (url.endsWith('/planning-cycles') && init?.method === 'POST') {
        return jsonResponse({
          id: 'cycle-1',
          name: 'Q2 guardias',
          status: 'draft',
          sprintIds: [],
          createdAt: '2026-03-01T09:00:00.000Z',
          updatedAt: '2026-03-01T09:00:00.000Z',
        });
      }

      if (url.endsWith('/planning-cycles') && init?.method === 'GET') {
        return jsonResponse({
          items: [
            {
              id: 'cycle-1',
              name: 'Q2 guardias',
              status: 'draft',
              sprintIds: [],
              createdAt: '2026-03-01T09:00:00.000Z',
              updatedAt: '2026-03-01T09:00:00.000Z',
            },
          ],
        });
      }

      if (url.includes('/planning-cycles/cycle-1') && init?.method === 'GET') {
        return jsonResponse({
          id: 'cycle-1',
          name: 'Q2 guardias',
          status: 'draft',
          sprintIds: [],
          createdAt: '2026-03-01T09:00:00.000Z',
          updatedAt: '2026-03-01T09:00:00.000Z',
        });
      }

      if (url.includes('/planning-cycles/cycle-1/runs') && init?.method === 'GET') {
        return jsonResponse({
          items: [],
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    renderApp();

    fireEvent.change(screen.getByLabelText('Bearer token'), { target: { value: 'token-1' } });
    fireEvent.change(screen.getByLabelText('Nombre de ciclo'), { target: { value: 'Q2 guardias' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear ciclo' }));

    expect(await screen.findByText('Ciclo Q2 guardias creado.')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/planning-cycles'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('adds sprint to selected cycle', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const rawUrl = String(input);
      const url = new URL(rawUrl);

      if (url.pathname === '/planning-cycles' && init?.method === 'GET') {
        return jsonResponse({
          items: [
            {
              id: 'cycle-1',
              name: 'Q2 guardias',
              status: 'draft',
              sprintIds: [],
              createdAt: '2026-03-01T09:00:00.000Z',
              updatedAt: '2026-03-01T09:00:00.000Z',
            },
          ],
        });
      }

      if (url.pathname === '/planning-cycles/cycle-1' && init?.method === 'GET') {
        return jsonResponse({
          id: 'cycle-1',
          name: 'Q2 guardias',
          status: 'draft',
          sprintIds: ['sprint-1'],
          createdAt: '2026-03-01T09:00:00.000Z',
          updatedAt: '2026-03-01T09:10:00.000Z',
        });
      }

      if (url.pathname === '/planning-cycles/cycle-1/runs' && init?.method === 'GET') {
        return jsonResponse({
          items: [],
        });
      }

      if (url.pathname === '/planning-cycles/cycle-1/sprints' && init?.method === 'POST') {
        return jsonResponse({
          id: 'cycle-1',
          name: 'Q2 guardias',
          status: 'draft',
          sprintIds: ['sprint-1'],
          createdAt: '2026-03-01T09:00:00.000Z',
          updatedAt: '2026-03-01T09:10:00.000Z',
        });
      }

      throw new Error(`Unexpected fetch call: ${rawUrl}`);
    });

    renderApp();

    fireEvent.change(screen.getByLabelText('Bearer token'), { target: { value: 'token-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar ciclos' }));

    await screen.findByText('Q2 guardias');
    fireEvent.click(screen.getByText('Q2 guardias'));

    fireEvent.change(screen.getByLabelText('Sprint ID ciclo'), { target: { value: 'sprint-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar sprint al ciclo' }));

    expect(await screen.findByText('Sprint agregado al ciclo.')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/planning-cycles/cycle-1/sprints'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('loads more planning cycle runs with cursor pagination', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const rawUrl = String(input);
      const url = new URL(rawUrl);

      if (url.pathname === '/planning-cycles' && init?.method === 'GET') {
        return jsonResponse({
          items: [
            {
              id: 'cycle-1',
              name: 'Q2 guardias',
              status: 'draft',
              sprintIds: ['sprint-1'],
              createdAt: '2026-03-01T09:00:00.000Z',
              updatedAt: '2026-03-01T09:00:00.000Z',
            },
          ],
        });
      }

      if (url.pathname === '/planning-cycles/cycle-1' && init?.method === 'GET') {
        return jsonResponse({
          id: 'cycle-1',
          name: 'Q2 guardias',
          status: 'draft',
          sprintIds: ['sprint-1'],
          createdAt: '2026-03-01T09:00:00.000Z',
          updatedAt: '2026-03-01T09:00:00.000Z',
        });
      }

      if (url.pathname === '/planning-cycles/cycle-1/runs' && init?.method === 'GET') {
        if (url.searchParams.get('cursor') === '2026-03-01T10:00:00.000Z') {
          return jsonResponse({
            items: [
              {
                id: 'cycle-run-2',
                cycleId: 'cycle-1',
                executedAt: '2026-03-01T11:00:00.000Z',
                status: 'partial-failed',
                items: [],
              },
            ],
          });
        }

        return jsonResponse({
          items: [
            {
              id: 'cycle-run-1',
              cycleId: 'cycle-1',
              executedAt: '2026-03-01T10:00:00.000Z',
              status: 'succeeded',
              items: [],
            },
          ],
          nextCursor: '2026-03-01T10:00:00.000Z',
        });
      }

      throw new Error(`Unexpected fetch call: ${rawUrl}`);
    });

    renderApp();

    fireEvent.change(screen.getByLabelText('Bearer token'), { target: { value: 'token-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar ciclos' }));

    await screen.findByText('Q2 guardias');
    fireEvent.click(screen.getByText('Q2 guardias'));

    await screen.findByText('cycle-run-1');
    fireEvent.click(screen.getByRole('button', { name: 'Cargar mas corridas de ciclo' }));

    expect(await screen.findByText('cycle-run-2')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('cursor=2026-03-01T10%3A00%3A00.000Z'),
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  it('marks sprint ready and runs sprint solve rendering assignments', async () => {
    let sprintStatus: 'draft' | 'ready-to-solve' = 'draft';

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const rawUrl = String(input);
      const url = new URL(rawUrl);

      if (url.pathname === '/sprints/sprint-1' && init?.method === 'GET') {
        return jsonResponse({
          id: 'sprint-1',
          name: 'Sprint 1',
          periodId: 'p1',
          status: sprintStatus,
          globalConfig: {
            requiredDoctorsPerShift: 1,
            maxDaysPerDoctorDefault: 2,
          },
          doctorIds: ['d1'],
          availability: [
            {
              doctorId: 'd1',
              periodId: 'p1',
              dayId: '2026-03-02',
              source: 'doctor-self-service',
              updatedByUserId: 'd1',
              updatedByRole: 'doctor',
              updatedAt: '2026-03-01T09:30:00.000Z',
            },
          ],
          createdAt: '2026-03-01T09:00:00.000Z',
          updatedAt: '2026-03-01T09:30:00.000Z',
        });
      }

      if (url.pathname === '/sprints/sprint-1/status' && init?.method === 'PATCH') {
        sprintStatus = 'ready-to-solve';
        return jsonResponse({
          id: 'sprint-1',
          name: 'Sprint 1',
          periodId: 'p1',
          status: 'ready-to-solve',
          globalConfig: {
            requiredDoctorsPerShift: 1,
            maxDaysPerDoctorDefault: 2,
          },
          doctorIds: ['d1'],
          availability: [
            {
              doctorId: 'd1',
              periodId: 'p1',
              dayId: '2026-03-02',
              source: 'doctor-self-service',
              updatedByUserId: 'd1',
              updatedByRole: 'doctor',
              updatedAt: '2026-03-01T09:30:00.000Z',
            },
          ],
          createdAt: '2026-03-01T09:00:00.000Z',
          updatedAt: '2026-03-01T09:40:00.000Z',
        });
      }

      if (url.pathname === '/sprints/sprint-1/runs' && init?.method === 'POST') {
        return jsonResponse({
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
        });
      }

      if (url.pathname === '/sprints/sprint-1/runs' && init?.method === 'GET') {
        return jsonResponse({
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
        });
      }

      if (url.pathname === '/sprints/sprint-1/availability' && init?.method === 'GET') {
        return jsonResponse({
          items: [
            {
              doctorId: 'd1',
              periodId: 'p1',
              dayId: '2026-03-02',
              source: 'doctor-self-service',
              updatedByUserId: 'd1',
              updatedByRole: 'doctor',
              updatedAt: '2026-03-01T09:30:00.000Z',
            },
          ],
        });
      }

      if (url.pathname === '/planning-cycles' && init?.method === 'GET') {
        return jsonResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${rawUrl}`);
    });

    renderApp();

    fireEvent.change(screen.getByLabelText('Sprint ID'), { target: { value: 'sprint-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar sprint' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Marcar ready-to-solve' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Marcar ready-to-solve' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/sprints/sprint-1/status'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ejecutar corrida' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ejecutar corrida' }));

    expect(await screen.findByText('Resultado de la ultima corrida (succeeded)')).toBeInTheDocument();
    expect(screen.getAllByText('2026-03-02').length).toBeGreaterThan(0);
    expect(screen.getAllByText('d1').length).toBeGreaterThan(0);
  });
});
