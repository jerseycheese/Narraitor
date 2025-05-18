import React from 'react';
import { render, screen } from '@testing-library/react';
import GameSessionActive from './GameSessionActive';

describe('GameSessionActive', () => {
  const mockOnChoiceSelected = jest.fn();
  const mockNarrative = {
    text: 'You are in a dimly lit tavern. The air is thick with smoke and the scent of ale.',
    choices: [
      { id: 'choice-1', text: 'Talk to the mysterious figure' },
      { id: 'choice-2', text: 'Order a drink' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders narrative text', () => {
    render(
      <GameSessionActive 
        narrative={mockNarrative}
        onChoiceSelected={mockOnChoiceSelected}
      />
    );

    expect(screen.getByText(mockNarrative.text)).toBeInTheDocument();
  });

  test('renders world information', () => {
    const world = { name: 'Fantasy Realm', theme: 'Medieval Fantasy' };
    
    render(
      <GameSessionActive 
        narrative={mockNarrative}
        onChoiceSelected={mockOnChoiceSelected}
        world={world}
      />
    );

    expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
    expect(screen.getByText('Medieval Fantasy')).toBeInTheDocument();
  });

  test('renders current scene id', () => {
    render(
      <GameSessionActive 
        narrative={mockNarrative}
        onChoiceSelected={mockOnChoiceSelected}
        currentSceneId="scene-001"
      />
    );

    expect(screen.getByText(/Scene ID: scene-001/)).toBeInTheDocument();
  });

  test('renders session status', () => {
    render(
      <GameSessionActive 
        narrative={mockNarrative}
        onChoiceSelected={mockOnChoiceSelected}
        status="active"
      />
    );

    expect(screen.getByText(/Status: active/)).toBeInTheDocument();
  });

  test('renders without choices when none provided', () => {
    const narrativeNoChoices = { text: 'The story continues...' };
    
    render(
      <GameSessionActive 
        narrative={narrativeNoChoices}
        onChoiceSelected={mockOnChoiceSelected}
      />
    );

    expect(screen.getByText('The story continues...')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });
});