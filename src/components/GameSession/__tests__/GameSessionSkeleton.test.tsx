import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameSessionSkeleton } from '../GameSessionSkeleton';
import { GAME_SESSION_STABLE_COLUMN_HEIGHT } from '../layoutStability';

describe('GameSessionSkeleton', () => {
  it('locks narrative and choices skeleton columns to stable heights', () => {
    render(<GameSessionSkeleton />);

    const narrativeColumn = screen.getByTestId(
      'game-session-skeleton-narrative-column'
    ) as HTMLDivElement;
    const choicesColumn = screen.getByTestId(
      'game-session-skeleton-choices-column'
    ) as HTMLDivElement;

    expect(narrativeColumn.style.height).toBe(GAME_SESSION_STABLE_COLUMN_HEIGHT);
    expect(narrativeColumn.style.maxHeight).toBe(
      GAME_SESSION_STABLE_COLUMN_HEIGHT
    );
    expect(choicesColumn.style.height).toBe(GAME_SESSION_STABLE_COLUMN_HEIGHT);
    expect(choicesColumn.style.maxHeight).toBe(
      GAME_SESSION_STABLE_COLUMN_HEIGHT
    );
  });
});
