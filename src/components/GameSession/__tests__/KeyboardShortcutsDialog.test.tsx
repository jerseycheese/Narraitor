import React from 'react';
import { render, screen } from '@testing-library/react';
import { KeyboardShortcutsDialog } from '../KeyboardShortcutsDialog';

describe('KeyboardShortcutsDialog', () => {
  it('is not in the document when closed', () => {
    render(<KeyboardShortcutsDialog open={false} onOpenChange={jest.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists the game-session keyboard shortcuts when open', () => {
    render(<KeyboardShortcutsDialog open onOpenChange={jest.fn()} />);

    const dialog = screen.getByRole('dialog', { name: /keyboard shortcuts/i });
    expect(dialog).toBeInTheDocument();

    expect(screen.getByText(/select a suggested action/i)).toBeInTheDocument();
    expect(screen.getByText(/open journal/i)).toBeInTheDocument();
    expect(screen.getByText(/toggle character sheet/i)).toBeInTheDocument();
    expect(screen.getByText(/close a dialog or panel/i)).toBeInTheDocument();
    expect(screen.getByText(/show this shortcuts guide/i)).toBeInTheDocument();
  });
});
