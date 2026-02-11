import React from 'react';
import { render, screen } from '@testing-library/react';
import GameSessionLoading from '../GameSessionLoading';
import { GAME_SESSION_STABLE_COLUMN_HEIGHT } from '../layoutStability';

describe('GameSessionLoading', () => {
  it('reserves stable height while loading to prevent layout jumps', () => {
    render(<GameSessionLoading />);

    const loadingContainer = screen.getByTestId('game-session-loading');
    expect(loadingContainer.style.minHeight).toBe(
      GAME_SESSION_STABLE_COLUMN_HEIGHT
    );
  });
});
