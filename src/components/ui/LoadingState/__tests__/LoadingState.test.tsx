import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '../LoadingState';

describe('LoadingState', () => {
  it('renders the pulse variant with styled, classed elements', () => {
    render(<LoadingState variant="pulse" />);

    const status = screen.getByRole('status');
    expect(status.className).not.toBe('');
    expect(status.querySelectorAll('.component-loading-pulse-line').length).toBeGreaterThan(0);
  });

  it('renders the dots variant with styled, classed elements', () => {
    render(<LoadingState variant="dots" />);

    const status = screen.getByRole('status');
    expect(status.className).not.toBe('');
    expect(status.querySelectorAll('.component-loading-dot').length).toBe(3);
  });

  it('renders the skeleton variant with styled, classed elements', () => {
    render(<LoadingState variant="skeleton" skeletonLines={5} />);

    const status = screen.getByRole('status');
    expect(status.className).not.toBe('');
    expect(status.querySelectorAll('.component-loading-skeleton-line').length).toBe(5);
  });
});
