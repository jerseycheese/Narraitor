import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ErrorDisplay } from './ErrorDisplay';

describe('ErrorDisplay', () => {
  it('applies a severity class so styling can reflect severity', () => {
    const { container } = render(
      <ErrorDisplay variant="section" message="Some features are limited." severity="warning" />
    );

    const root = container.querySelector('.error-display');
    expect(root).toHaveClass('error-display-warning');
  });

  it('defaults to error severity when none is given', () => {
    const { container } = render(<ErrorDisplay variant="section" message="It broke." />);

    expect(container.querySelector('.error-display')).toHaveClass('error-display-error');
  });

  it('renders a suggested next step when provided', () => {
    render(
      <ErrorDisplay
        variant="section"
        title="Connection Problem"
        message="Unable to connect."
        suggestion="Make sure you are online, then try again."
      />
    );

    expect(
      screen.getByText('Make sure you are online, then try again.')
    ).toBeInTheDocument();
  });

  it('omits the suggestion element when no suggestion is given', () => {
    const { container } = render(
      <ErrorDisplay variant="section" message="Unable to connect." />
    );

    expect(container.querySelector('.error-display-suggestion')).toBeNull();
  });

  // Recoverable errors offer retry; non-recoverable ones do not.
  it('shows a retry button only when retry is enabled and a callback is given', () => {
    const { rerender } = render(
      <ErrorDisplay variant="section" message="Non-recoverable." />
    );
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull();

    rerender(
      <ErrorDisplay variant="section" message="Recoverable." showRetry onRetry={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('invokes the retry callback when the retry button is clicked', async () => {
    const onRetry = jest.fn();
    render(
      <ErrorDisplay variant="section" message="Recoverable." showRetry onRetry={onRetry} />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows in-progress feedback while an async retry is pending', async () => {
    let resolveRetry: () => void = () => {};
    const onRetry = jest.fn(
      () => new Promise<void>((resolve) => { resolveRetry = resolve; })
    );

    render(
      <ErrorDisplay variant="section" message="Recoverable." showRetry onRetry={onRetry} />
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    const retrying = await screen.findByRole('button', { name: /retrying/i });
    expect(retrying).toBeDisabled();
    expect(retrying).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(/retrying/i);

    await act(async () => {
      resolveRetry();
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /try again/i })).toBeEnabled()
    );
  });

  it('supports multiple retry attempts when no limit is set', async () => {
    const onRetry = jest.fn();
    render(
      <ErrorDisplay variant="section" message="Recoverable." showRetry onRetry={onRetry} />
    );

    const button = screen.getByRole('button', { name: /try again/i });
    await act(async () => { fireEvent.click(button); });
    await act(async () => { fireEvent.click(button); });

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('degrades to a fallback action once retries are exhausted', async () => {
    const onRetry = jest.fn();
    const onFallback = jest.fn();

    render(
      <ErrorDisplay
        variant="section"
        message="Persistent failure."
        showRetry
        onRetry={onRetry}
        maxRetries={1}
        fallbackMessage="Still stuck. Head back to your worlds."
        fallbackLabel="Back to Worlds"
        onFallback={onFallback}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    });

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
    );
    expect(screen.getByText('Still stuck. Head back to your worlds.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to worlds/i }));
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
