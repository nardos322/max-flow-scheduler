import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App.js';

describe('App', () => {
  it('renders title', () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Max Flow Scheduler' })).toBeInTheDocument();
  });
});
