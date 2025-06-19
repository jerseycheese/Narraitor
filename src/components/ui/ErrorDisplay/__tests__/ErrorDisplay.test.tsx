import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay, InlineError, SectionError, PageError, ToastError } from '../ErrorDisplay';

describe('ErrorDisplay', () => {
  const defaultProps = {
    message: 'Test error message',
    onRetry: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Inline variant', () => {
    test('renders inline error message', () => {
      render(<InlineError message="Field is required" />);
      expect(screen.getByText('Field is required')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('text-sm', 'mt-1', 'text-red-600');
    });

    test('applies field name for accessibility', () => {
      render(<InlineError message="Invalid email" fieldName="email" />);
      expect(screen.getByRole('alert')).toHaveAttribute('id', 'email-error');
    });

    test('applies different severity styles', () => {
      const { rerender } = render(<InlineError message="Error" severity="error" />);
      expect(screen.getByRole('alert')).toHaveClass('text-red-600');

      rerender(<InlineError message="Warning" severity="warning" />);
      expect(screen.getByRole('alert')).toHaveClass('text-yellow-600');

      rerender(<InlineError message="Info" severity="info" />);
      expect(screen.getByRole('alert')).toHaveClass('text-blue-600');
    });
  });

  describe('Section variant', () => {
    test('renders section error with title and message', () => {
      render(
        <SectionError
          title="Error Title"
          message="Error message"
        />
      );
      expect(screen.getByRole('heading', { name: 'Error Title' })).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    test('shows retry and dismiss buttons when enabled', () => {
      render(
        <SectionError
          {...defaultProps}
          showRetry
          showDismiss
        />
      );
      
      const retryButton = screen.getByText('Try Again');
      const dismissButton = screen.getByText('Dismiss');
      
      expect(retryButton).toBeInTheDocument();
      expect(dismissButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
      
      fireEvent.click(dismissButton);
      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });

    test('applies severity-specific styles', () => {
      render(<SectionError message="Test" severity="warning" />);
      expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });
  });

  describe('Page variant', () => {
    test('renders page error with centered layout', () => {
      render(
        <PageError
          title="Page Error"
          message="Something went wrong"
        />
      );
      
      const container = screen.getByRole('alert');
      expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page Error');
    });

    test('handles actions correctly', () => {
      render(
        <PageError
          {...defaultProps}
          showRetry
          showDismiss
        />
      );
      
      fireEvent.click(screen.getByText('Try Again'));
      expect(defaultProps.onRetry).toHaveBeenCalled();
      
      fireEvent.click(screen.getByText('Dismiss'));
      expect(defaultProps.onDismiss).toHaveBeenCalled();
    });
  });

  describe('Toast variant', () => {
    test('renders toast with fixed positioning', () => {
      render(
        <ToastError
          title="Toast Title"
          message="Toast message"
        />
      );
      
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('fixed', 'bottom-4', 'right-4', 'animate-slide-up');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
    });

    test('shows dismiss button with close icon', () => {
      render(
        <ToastError
          {...defaultProps}
          showDismiss
        />
      );
      
      const dismissButton = screen.getByLabelText('Dismiss');
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton.querySelector('svg')).toBeInTheDocument();
      
      fireEvent.click(dismissButton);
      expect(defaultProps.onDismiss).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('includes proper ARIA attributes', () => {
      const { rerender } = render(<ErrorDisplay message="Error" variant="section" />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
      
      rerender(<ErrorDisplay message="Error" variant="toast" />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    test('associates inline errors with form fields', () => {
      render(<InlineError message="Required" fieldName="username" />);
      expect(screen.getByRole('alert')).toHaveAttribute('id', 'username-error');
    });
  });

  describe('Custom styling', () => {
    test('applies custom className', () => {
      render(
        <ErrorDisplay
          message="Test"
          variant="section"
          className="custom-class"
        />
      );
      expect(screen.getByRole('alert')).toHaveClass('custom-class');
    });
  });
});
