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

  it('renders scenario editor', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Scenario Editor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolver escenario' })).toBeInTheDocument();
  });

  it('blocks submit when payload is invalid', async () => {
    renderApp();

    const doctorIdInput = screen.getByLabelText('Doctor id 1');
    fireEvent.change(doctorIdInput, { target: { value: '' } });

    expect(screen.getByRole('button', { name: 'Resolver escenario' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('doctors.0.id');
  });

  it('calls api and renders solver summary for valid payload', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        contractVersion: '1.0',
        isFeasible: true,
        assignedCount: 2,
        uncoveredDays: [],
        assignments: [
          { doctorId: 'd1', dayId: 'day-1', periodId: 'p1' },
          { doctorId: 'd1', dayId: 'day-2', periodId: 'p1' },
        ],
      }),
    } as Response);

    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Resolver escenario' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Assigned count: 2')).toBeInTheDocument();
  });
});
