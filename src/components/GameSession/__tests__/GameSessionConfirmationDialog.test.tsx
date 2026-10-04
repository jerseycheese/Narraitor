import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameSessionConfirmationDialog } from '../GameSessionConfirmationDialog';

describe('GameSessionConfirmationDialog (exit)', () => {
  it('invokes onConfirm when the player confirms leaving the story', () => {
    // onConfirm is wired to router navigation at the page level, so this guards
    // that the exit-confirmation Confirm actually fires the leave flow (#1424).
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    render(
      <GameSessionConfirmationDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        type="exit"
        currentProgress={3}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /leave story/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps the player in the session when they cancel', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    render(
      <GameSessionConfirmationDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        type="exit"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /keep playing/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('GameSessionConfirmationDialog (character-switch)', () => {
  it('replaces character placeholder with the character name without mutating "Switching characters"', () => {
    render(
      <GameSessionConfirmationDialog
        isOpen
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        type="character-switch"
        characterName="Elena the Brave"
      />
    );

    expect(
      screen.getByText(
        'Switching characters ends the current session and starts a new one with the selected Elena the Brave. Your existing progress is saved so you can return later.'
      )
    ).toBeInTheDocument();
  });

  it('falls back to "selected character" when characterName is not provided', () => {
    render(
      <GameSessionConfirmationDialog
        isOpen
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        type="character-switch"
      />
    );

    expect(
      screen.getByText(
        'Switching characters ends the current session and starts a new one with the selected character. Your existing progress is saved so you can return later.'
      )
    ).toBeInTheDocument();
  });
});
