'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ShortcutEntry {
  keys: string[];
  description: string;
}

// Only the shortcuts actually wired up in the game session (#276). Keep this
// list in sync with ChoiceSelector's number-key handling and the 'j'/'c'/'?'
// bindings in ActiveGameSession.
const SHORTCUTS: ShortcutEntry[] = [
  { keys: ['1', '-', '3'], description: 'Select a suggested action' },
  { keys: ['Enter'], description: 'Submit a custom action while typing' },
  { keys: ['J'], description: 'Open journal' },
  { keys: ['C'], description: 'Toggle character sheet' },
  { keys: ['Esc'], description: 'Close a dialog or panel' },
  { keys: ['?'], description: 'Show this shortcuts guide' },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="keyboard-shortcuts-dialog"
        aria-describedby={undefined}
      >
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        <ul className="keyboard-shortcuts-list">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.description} className="keyboard-shortcuts-item">
              <span className="keyboard-shortcuts-keys">
                {shortcut.keys.map((key) => (
                  <kbd key={key} className="keyboard-shortcuts-key">
                    {key}
                  </kbd>
                ))}
              </span>
              <span className="keyboard-shortcuts-description">{shortcut.description}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
