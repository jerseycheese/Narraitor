import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldCardActions from '../WorldCardActions';

describe('WorldCardActions', () => {
  // Test case for rendering action buttons
  test('renders play, edit, and delete buttons', () => {
    render(<WorldCardActions onPlay={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByTestId('world-card-actions-play-button')).toBeInTheDocument();
    expect(screen.getByTestId('world-card-actions-edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('world-card-actions-delete-button')).toBeInTheDocument();
  });

  // Test case for triggering handlers
  test('calls correct handlers when buttons are clicked', () => {
    const mockOnPlay = jest.fn();
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    render(<WorldCardActions onPlay={mockOnPlay} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByTestId('world-card-actions-play-button'));
    expect(mockOnPlay).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('world-card-actions-edit-button'));
    expect(mockOnEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('world-card-actions-delete-button'));
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });
});
