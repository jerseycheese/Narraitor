/**
 * Unit tests for JournalViewToggle component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { JournalViewToggle } from '../JournalViewToggle';

describe('JournalViewToggle', () => {
  const mockOnModeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both list and table view buttons', () => {
    render(<JournalViewToggle mode="list" onModeChange={mockOnModeChange} />);

    expect(screen.getByRole('button', { name: 'List view' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Table view' })).toBeInTheDocument();
  });

  it('sets aria-pressed correctly for list mode', () => {
    render(<JournalViewToggle mode="list" onModeChange={mockOnModeChange} />);

    expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Table view' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('sets aria-pressed correctly for table mode', () => {
    render(<JournalViewToggle mode="table" onModeChange={mockOnModeChange} />);

    expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Table view' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('calls onModeChange with "table" when table button clicked', () => {
    render(<JournalViewToggle mode="list" onModeChange={mockOnModeChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));

    expect(mockOnModeChange).toHaveBeenCalledTimes(1);
    expect(mockOnModeChange).toHaveBeenCalledWith('table');
  });

  it('calls onModeChange with "list" when list button clicked', () => {
    render(<JournalViewToggle mode="table" onModeChange={mockOnModeChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'List view' }));

    expect(mockOnModeChange).toHaveBeenCalledTimes(1);
    expect(mockOnModeChange).toHaveBeenCalledWith('list');
  });

  it('has proper role group with aria-label', () => {
    render(<JournalViewToggle mode="list" onModeChange={mockOnModeChange} />);

    expect(screen.getByRole('group', { name: 'View mode toggle' })).toBeInTheDocument();
  });
});
