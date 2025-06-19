import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JournalFloatingButton } from '../JournalFloatingButton';

describe('JournalFloatingButton', () => {
  const defaultProps = {
    onClick: jest.fn(),
    hasUnreadEntries: false,
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
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('shows unread indicator when hasUnreadEntries is true', () => {
    render(<JournalFloatingButton {...defaultProps} hasUnreadEntries={true} />);
    
    expect(screen.getByText('•')).toBeInTheDocument();
  });

  it('does not show unread indicator when hasUnreadEntries is false', () => {
    render(<JournalFloatingButton {...defaultProps} hasUnreadEntries={false} />);
    
    expect(screen.queryByText('•')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<JournalFloatingButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /open journal/i });
    expect(button).toHaveAttribute('aria-label', 'Open journal');
  });

  it('displays keyboard shortcut hint in tooltip', () => {
    render(<JournalFloatingButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /open journal/i });
    expect(button).toHaveAttribute('title', 'Open journal (J)');
  });
});