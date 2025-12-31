import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog';

describe('DeleteConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Delete World',
    description: 'Are you sure you want to delete this world? This action cannot be undone.',
    itemName: 'Test World',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders dialog with all required content when open', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);
      
      expect(screen.getByText('Delete World')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this world? This action cannot be undone.')).toBeInTheDocument();
      expect(screen.getByText('Test World')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
      render(<DeleteConfirmationDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Delete World')).not.toBeInTheDocument();
    });

    test('renders custom button text when provided', () => {
      render(
        <DeleteConfirmationDialog
          {...defaultProps}
          confirmButtonText="Remove"
          cancelButtonText="Keep"
        />
      );
      
      expect(screen.getByRole('button', { name: /Remove/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Keep/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('calls onClose when cancel button is clicked', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    test('calls onConfirm when delete button is clicked', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    test('calls onClose when escape key is pressed', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);
      
      // Press escape key to close dialog
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    test('disables buttons and shows loading text when isDeleting is true', () => {
      render(<DeleteConfirmationDialog {...defaultProps} isDeleting={true} />);
      
      const deleteButton = screen.getByRole('button', { name: /Delete Test World/i });
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      
      expect(deleteButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      expect(screen.getByText(/deleting/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('closes on Escape key press', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    test('has proper dialog structure', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Delete World' })).toBeInTheDocument();
    });
  });
});
