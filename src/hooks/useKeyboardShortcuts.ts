import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

/**
 * Custom hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !shortcut.ctrlKey || event.ctrlKey === shortcut.ctrlKey;
      const altMatches = !shortcut.altKey || event.altKey === shortcut.altKey;
      const shiftMatches = !shortcut.shiftKey || event.shiftKey === shortcut.shiftKey;
      const metaMatches = !shortcut.metaKey || event.metaKey === shortcut.metaKey;

      return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  return { shortcuts };
}

/**
 * Hook specifically for journal shortcuts
 */
export function useJournalShortcuts(onOpenJournal: () => void, enabled: boolean = true) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'j',
      action: onOpenJournal,
      description: 'Open journal'
    }
  ];

  return useKeyboardShortcuts(shortcuts, enabled);
}