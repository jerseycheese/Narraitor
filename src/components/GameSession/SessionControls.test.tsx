import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SessionControls from './SessionControls';

describe('SessionControls', () => {
  const mockOnPause = jest.fn();
  const mockOnResume = jest.fn();
  const mockOnEnd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders controls for active session', () => {
    render(
      <SessionControls 
        status="active"
        onPause={mockOnPause}
        onResume={mockOnResume}
        onEnd={mockOnEnd}
      />
    );

    expect(screen.getByText(/Pause/)).toBeInTheDocument();
    expect(screen.getByText(/End Session/)).toBeInTheDocument();
  });

  test('renders controls for paused session', () => {
    render(
      <SessionControls 
        status="paused"
        onPause={mockOnPause}
        onResume={mockOnResume}
        onEnd={mockOnEnd}
      />
    );

    expect(screen.getByText(/Resume/)).toBeInTheDocument();
    expect(screen.getByText(/End Session/)).toBeInTheDocument();
  });

  test('calls onPause when pause button is clicked', () => {
    render(
      <SessionControls 
        status="active"
        onPause={mockOnPause}
        onResume={mockOnResume}
        onEnd={mockOnEnd}
      />
    );

    const pauseButton = screen.getByRole('button', { name: /Pause/ });
    fireEvent.click(pauseButton);

    expect(mockOnPause).toHaveBeenCalledTimes(1);
  });

  test('calls onResume when resume button is clicked', () => {
    render(
      <SessionControls 
        status="paused"
        onPause={mockOnPause}
        onResume={mockOnResume}
        onEnd={mockOnEnd}
      />
    );

    const resumeButton = screen.getByRole('button', { name: /Resume/ });
    fireEvent.click(resumeButton);

    expect(mockOnResume).toHaveBeenCalledTimes(1);
  });

  test('calls onEnd when end session button is clicked', () => {
    render(
      <SessionControls 
        status="active"
        onPause={mockOnPause}
        onResume={mockOnResume}
        onEnd={mockOnEnd}
      />
    );

    const endButton = screen.getByRole('button', { name: /End Session/ });
    fireEvent.click(endButton);

    expect(mockOnEnd).toHaveBeenCalledTimes(1);
  });

  test('maintains button accessibility attributes', () => {
    render(
      <SessionControls 
        status="paused"
        onPause={mockOnPause}
        onResume={mockOnResume}
        onEnd={mockOnEnd}
      />
    );

    const pauseResumeButton = screen.getByTestId('game-session-controls-pause');
    expect(pauseResumeButton).toHaveAttribute('aria-pressed', 'true');
  });
});