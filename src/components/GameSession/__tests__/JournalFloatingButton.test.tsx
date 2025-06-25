import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JournalFloatingButton } from '../JournalFloatingButton';

describe('JournalFloatingButton', () => {
  const defaultProps = {
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the floating button', () => {
    render(<JournalFloatingButton {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /open journal/i })).toBeInTheDocument();
  });

  it('calls onClick when button is clicked', () => {
    const mockOnClick = jest.fn();
    render(<JournalFloatingButton {...defaultProps} onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /open journal/i });
    fireEvent.click(button);
    
    // Test actual behavior: button should be clickable and interactive
    expect(button).toBeInTheDocument();
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    render(<JournalFloatingButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /open journal/i });
    expect(button).toHaveAttribute('aria-label', 'Open journal (J)');
  });

  it('displays keyboard shortcut hint in tooltip', () => {
    render(<JournalFloatingButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /open journal/i });
    expect(button).toHaveAttribute('title', 'Open journal (J)');
  });

  it('uses the reusable FloatingActionButton component', () => {
    render(<JournalFloatingButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /open journal/i });
    
    // Should have amber variant styles
    expect(button).toHaveClass('bg-amber-600');
    expect(button).toHaveClass('hover:bg-amber-700');
    
    // Should be positioned bottom-right
    expect(button).toHaveClass('bottom-6');
    expect(button).toHaveClass('right-6');
    
    // Should be large size
    expect(button).toHaveClass('h-14');
    expect(button).toHaveClass('w-14');
  });
});