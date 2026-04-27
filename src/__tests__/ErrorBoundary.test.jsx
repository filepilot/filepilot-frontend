import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// Suppress the console.error noise React prints for expected errors in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function Bomb({ shouldThrow }) {
  if (shouldThrow) throw new Error('💣 test error');
  return <p>All good</p>;
}

describe('ErrorBoundary', () => {
  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('shows fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });

  it('shows a Refresh Page button in the fallback', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
  });

  it('Refresh Page button calls window.location.reload', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    screen.getByRole('button', { name: /refresh page/i }).click();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
