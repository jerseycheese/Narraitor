import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SessionControls from './SessionControls';

describe('SessionControls', () => {
  const mockOnEnd = jest.fn();
  const mockOnRestart = jest.fn();
  const mockOnEndStory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders minimal controls with only end session button', () => {
    render(<SessionControls onEnd={mockOnEnd} />);

    expect(screen.getByText('End Session')).toBeInTheDocument();
    expect(screen.queryByText('New Session')).not.toBeInTheDocument();
    expect(screen.queryByText('End Story')).not.toBeInTheDocument();
  });

  test('renders all optional controls when provided', () => {
    render(
      <SessionControls 
        onEnd={mockOnEnd}
        onRestart={mockOnRestart}
        onEndStory={mockOnEndStory}
      />
    );

    expect(screen.getByText('End Session')).toBeInTheDocument();
    expect(screen.getByText('New Session')).toBeInTheDocument();
    expect(screen.getByText('End Story')).toBeInTheDocument();
  });

  test('calls onEnd when end session button is clicked', () => {
    render(<SessionControls onEnd={mockOnEnd} />);

    const endButton = screen.getByRole('button', { name: /End Session/ });
    fireEvent.click(endButton);

    expect(mockOnEnd).toHaveBeenCalledTimes(1);
  });

  test('calls onRestart when new session button is clicked', () => {
    render(
      <SessionControls 
        onEnd={mockOnEnd}
        onRestart={mockOnRestart}
      />
    );

    const restartButton = screen.getByRole('button', { name: /New Session/ });
    fireEvent.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalledTimes(1);
  });

  test('calls onEndStory when end story button is clicked', () => {
    render(
      <SessionControls 
        onEnd={mockOnEnd}
        onEndStory={mockOnEndStory}
      />
    );

    const endStoryButton = screen.getByRole('button', { name: /End Story/ });
    fireEvent.click(endStoryButton);

    expect(mockOnEndStory).toHaveBeenCalledTimes(1);
  });
});
