/**
 * Unit tests for CharacterViewToggle component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterViewToggle } from '@/components/character/CharacterViewToggle';

describe('CharacterViewToggle', () => {
  const mockOnModeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both grid and table view buttons', () => {
    render(<CharacterViewToggle mode="grid" onModeChange={mockOnModeChange} />);

    expect(screen.getByRole('button', { name: 'Grid view' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Table view' })).toBeInTheDocument();
  });

  it('sets aria-pressed correctly for grid mode', () => {
    render(<CharacterViewToggle mode="grid" onModeChange={mockOnModeChange} />);

    const gridBtn = screen.getByRole('button', { name: 'Grid view' });
    const tableBtn = screen.getByRole('button', { name: 'Table view' });

    expect(gridBtn).toHaveAttribute('aria-pressed', 'true');
    expect(tableBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('sets aria-pressed correctly for table mode', () => {
    render(<CharacterViewToggle mode="table" onModeChange={mockOnModeChange} />);

    const gridBtn = screen.getByRole('button', { name: 'Grid view' });
    const tableBtn = screen.getByRole('button', { name: 'Table view' });

    expect(gridBtn).toHaveAttribute('aria-pressed', 'false');
    expect(tableBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onModeChange with "grid" when grid button clicked', () => {
    render(<CharacterViewToggle mode="table" onModeChange={mockOnModeChange} />);

    const gridBtn = screen.getByRole('button', { name: 'Grid view' });
    fireEvent.click(gridBtn);

    expect(mockOnModeChange).toHaveBeenCalledTimes(1);
    expect(mockOnModeChange).toHaveBeenCalledWith('grid');
  });

  it('calls onModeChange with "table" when table button clicked', () => {
    render(<CharacterViewToggle mode="grid" onModeChange={mockOnModeChange} />);

    const tableBtn = screen.getByRole('button', { name: 'Table view' });
    fireEvent.click(tableBtn);

    expect(mockOnModeChange).toHaveBeenCalledTimes(1);
    expect(mockOnModeChange).toHaveBeenCalledWith('table');
  });

  it('applies correct variant to active button', () => {
    const { rerender } = render(<CharacterViewToggle mode="grid" onModeChange={mockOnModeChange} />);

    const gridBtn = screen.getByRole('button', { name: 'Grid view' });
    const tableBtn = screen.getByRole('button', { name: 'Table view' });

    // Grid is active - should have 'default' variant styling
    expect(gridBtn).not.toHaveClass('border-input');

    // Switch to table mode
    rerender(<CharacterViewToggle mode="table" onModeChange={mockOnModeChange} />);

    // Table is active - should have 'default' variant styling
    expect(tableBtn).not.toHaveClass('border-input');
  });

  it('has proper role group with aria-label', () => {
    render(<CharacterViewToggle mode="grid" onModeChange={mockOnModeChange} />);

    const group = screen.getByRole('group', { name: 'View mode toggle' });
    expect(group).toBeInTheDocument();
  });

  it('renders icons for both buttons', () => {
    const { container } = render(<CharacterViewToggle mode="grid" onModeChange={mockOnModeChange} />);

    // Check that SVG icons are present (Lucide icons render as SVGs)
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2); // Grid3x3 and Table icons
  });
});
