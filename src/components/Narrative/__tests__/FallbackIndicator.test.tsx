import React from 'react';
import { render, screen } from '@testing-library/react';
import { FallbackIndicator } from '../FallbackIndicator';

describe('FallbackIndicator', () => {
  it('should not render when not visible', () => {
    const { container } = render(<FallbackIndicator isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render with default reason', () => {
    render(<FallbackIndicator isVisible={true} />);
    expect(screen.getByText(/AI service temporarily unavailable/)).toBeInTheDocument();
    expect(screen.getByText('🔌')).toBeInTheDocument();
  });

  it('should render timeout message', () => {
    render(<FallbackIndicator isVisible={true} reason="timeout" />);
    expect(screen.getByText(/AI response timed out/)).toBeInTheDocument();
    expect(screen.getByText('⏱️')).toBeInTheDocument();
  });

  it('should render error message', () => {
    render(<FallbackIndicator isVisible={true} reason="error" />);
    expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should render rate limit message', () => {
    render(<FallbackIndicator isVisible={true} reason="rate_limit" />);
    expect(screen.getByText(/Rate limit reached/)).toBeInTheDocument();
    expect(screen.getByText('🚦')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<FallbackIndicator isVisible={true} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('should apply custom className', () => {
    render(<FallbackIndicator isVisible={true} className="custom-class" />);
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('custom-class');
  });
});