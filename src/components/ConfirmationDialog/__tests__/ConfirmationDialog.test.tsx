import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmationDialog } from '../ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed with this action?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the dialog when open', () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed with this action?')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<ConfirmationDialog {...mockProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders confirm and cancel buttons by default', () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders custom button text when provided', () => {
      render(
        <ConfirmationDialog 
          {...mockProps} 
          confirmText="Delete" 
          cancelText="Keep" 
        />
      );
      
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies destructive styling for destructive variant', () => {
      render(<ConfirmationDialog {...mockProps} variant="destructive" />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('applies warning styling for warning variant', () => {
      render(<ConfirmationDialog {...mockProps} variant="warning" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('border-yellow-200');
    });

    it('applies info styling for info variant', () => {
      render(<ConfirmationDialog {...mockProps} variant="info" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('border-blue-200');
    });

    it('applies default styling when no variant is specified', () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('border-gray-200');
    });
  });

  describe('Interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('handles escape key press to close dialog', () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('shows loading state on confirm button when isLoading is true', () => {
      render(<ConfirmationDialog {...mockProps} isLoading={true} />);
      
      const confirmButton = screen.getByRole('button', { name: /loading/i });
      expect(confirmButton).toBeDisabled();
      expect(confirmButton).toHaveTextContent('Loading...');
    });

    it('disables both buttons when loading', () => {
      render(<ConfirmationDialog {...mockProps} isLoading={true} />);
      
      const confirmButton = screen.getByRole('button', { name: /loading/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('shows custom loading text when provided', () => {
      render(<ConfirmationDialog {...mockProps} isLoading={true} loadingText="Deleting..." />);
      
      const confirmButton = screen.getByRole('button', { name: /deleting/i });
      expect(confirmButton).toHaveTextContent('Deleting...');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('focuses confirm button by default when not loading', async () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await waitFor(() => {
        expect(confirmButton).toHaveFocus();
      });
    });

    it('focuses cancel button when in destructive mode', async () => {
      render(<ConfirmationDialog {...mockProps} variant="destructive" />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await waitFor(() => {
        expect(cancelButton).toHaveFocus();
      });
    });
  });

  describe('Content Rendering', () => {
    it('renders message as text when string is provided', () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      expect(screen.getByText('Are you sure you want to proceed with this action?')).toBeInTheDocument();
    });

    it('renders message as JSX when ReactNode is provided', () => {
      const jsxMessage = (
        <div>
          <p>This action cannot be undone.</p>
          <p>Please confirm to proceed.</p>
        </div>
      );
      
      render(<ConfirmationDialog {...mockProps} message={jsxMessage} />);
      
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
      expect(screen.getByText('Please confirm to proceed.')).toBeInTheDocument();
    });

    it('renders without title when not provided', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { title, ...propsWithoutTitle } = mockProps;
      render(<ConfirmationDialog {...propsWithoutTitle} />);
      
      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('applies mobile-responsive classes', () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-md', 'sm:rounded-lg');
    });

    it('stacks buttons vertically on mobile', () => {
      render(<ConfirmationDialog {...mockProps} />);
      
      const footer = screen.getByRole('dialog').querySelector('.flex.flex-col-reverse');
      expect(footer).toHaveClass('flex-col-reverse', 'sm:flex-row');
    });
  });
});