import React from 'react';
import { render, screen } from '@testing-library/react';
import GameSessionResume from '../GameSessionResume';

describe('GameSessionResume action hierarchy', () => {
  it('renders Continue as the sole primary action', () => {
    const { container } = render(
      <GameSessionResume
        savedSession={{
          id: 'session-1',
          worldId: 'world-1',
          characterId: 'character-1',
          narrativeCount: 3,
          lastPlayed: '2026-09-12T12:00:00.000Z',
        }}
        onResume={jest.fn()}
        onNewGame={jest.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Continue Adventure' })
    ).toHaveClass('button-default');
    expect(
      screen.getByRole('button', { name: 'Start New Adventure' })
    ).toHaveClass('button-secondary');
    expect(container.querySelectorAll('.button-default')).toHaveLength(1);
  });
});
