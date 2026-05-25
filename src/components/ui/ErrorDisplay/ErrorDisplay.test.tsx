import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
