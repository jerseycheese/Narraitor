import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog';

describe('DeleteConfirmationDialog', () => {
  // Test case for open state
  test('renders the dialog when isOpen is true', () => {
    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        message="Are you sure you want to delete?"
      />
    );
    expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('delete-confirmation-dialog-message')).toHaveTextContent('Are you sure you want to delete?');
  });

  // Test case for closed state
  test('does not render the dialog when isOpen is false', () => {
    render(
      <DeleteConfirmationDialog
        isOpen={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        message="Are you sure you want to delete?"
      />
    );
    expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
  });

  // Test case for confirm action
  test('calls onConfirm when the confirm button is clicked', () => {
    const mockOnConfirm = jest.fn();
    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={mockOnConfirm}
        message="Are you sure you want to delete?"
      />
    );
    fireEvent.click(screen.getByTestId('delete-confirmation-dialog-confirm-button'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  // Test case for cancel action
  test('calls onClose when the cancel button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <DeleteConfirmationDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={jest.fn()}
        message="Are you sure you want to delete?"
      />
    );
    fireEvent.click(screen.getByTestId('delete-confirmation-dialog-cancel-button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
