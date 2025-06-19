import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingState, LoadingSpinner, LoadingSkeleton, LoadingDots, LoadingPulse } from '../LoadingState';

describe('LoadingState', () => {
  describe('Spinner variant', () => {
    test('renders spinner with default props', () => {
      render(<LoadingState />);
      expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    });

    test('renders spinner with custom message', () => {
      render(<LoadingState message="Please wait..." />);
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    test('renders inline spinner', () => {
      render(<LoadingState inline message="Saving..." />);
      const container = screen.getByText('Saving...').parentElement;
      expect(container).toHaveClass('inline-flex');
    });
  });

  describe('Skeleton variant', () => {
    test('renders skeleton lines', () => {
      render(<LoadingState variant="skeleton" skeletonLines={5} />);
      const skeletonContainer = screen.getByRole('status', { name: 'Loading' });
      const lines = skeletonContainer.querySelectorAll('.bg-gray-200');
      expect(lines).toHaveLength(5);
    });
  });

  describe('Dots variant', () => {
    test('renders three animated dots', () => {
      render(<LoadingState variant="dots" />);
      const dotsContainer = screen.getByRole('status', { name: 'Loading' });
      const dots = dotsContainer.querySelectorAll('.rounded-full');
      expect(dots).toHaveLength(3);
    });
  });

  describe('Pulse variant', () => {
    test('renders pulse animation with avatar', () => {
      render(<LoadingState variant="pulse" showAvatar />);
      const pulseContainer = screen.getByRole('status', { name: 'Loading' });
      expect(pulseContainer).toHaveClass('animate-pulse');
      expect(pulseContainer.querySelector('.rounded-full')).toBeInTheDocument();
    });
  });

  describe('Size variations', () => {
    test('applies correct size classes', () => {
      const { rerender } = render(<LoadingState size="sm" />);
      expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4');

      rerender(<LoadingState size="xl" />);
      expect(screen.getByRole('status')).toHaveClass('h-16', 'w-16');
    });
  });

  describe('Preset components', () => {
    test('LoadingSpinner renders spinner variant', () => {
      render(<LoadingSpinner message="Loading..." />);
      expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('animate-spin');
    });

    test('LoadingSkeleton renders skeleton variant', () => {
      render(<LoadingSkeleton />);
      const skeletonContainer = screen.getByRole('status', { name: 'Loading' });
      expect(skeletonContainer.querySelector('.bg-gray-200')).toBeInTheDocument();
    });

    test('LoadingDots renders dots variant', () => {
      render(<LoadingDots />);
      const dots = screen.getByRole('status', { name: 'Loading' }).querySelectorAll('.rounded-full');
      expect(dots).toHaveLength(3);
    });

    test('LoadingPulse renders pulse variant', () => {
      render(<LoadingPulse />);
      expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('animate-pulse');
    });
  });

  describe('Accessibility', () => {
    test('includes proper ARIA attributes', () => {
      render(<LoadingState message="Loading data..." />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading data...')).toHaveAttribute('aria-live', 'polite');
    });

    test('includes screen reader text', () => {
      render(<LoadingState />);
      expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    });
  });
});
