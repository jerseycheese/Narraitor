import { useEffect, useCallback } from 'react';
import { isInputElement } from '@/lib/utils/keyboardConstants';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  /**
   * Stay live while a field holds focus. `true` opts in from every input-like
   * element on the page; a predicate narrows that to the fields it names,
   * which is what a document-level listener usually wants.
   */
  ignoreInputs?: boolean | ((target: EventTarget | null) => boolean);
}

/**
 * Custom hook for managing keyboard shortcuts
 * 
 * Features:
 * - Support for modifier keys (Ctrl, Alt, Shift, Meta)
 * - Automatic input element detection to avoid conflicts
 * - Enable/disable functionality
 * - Proper event cleanup
 * - preventDefault and stopPropagation for matched shortcuts
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

    if (!matchingShortcut) return;

    // Typing in a field wins over a shortcut unless that shortcut opts in.
    // Matching first, then deciding, is what makes the opt-in possible: an
    // unmatched key never reaches this branch, so it types normally.
    const { ignoreInputs } = matchingShortcut;
    const optedIn =
      typeof ignoreInputs === 'function' ? ignoreInputs(event.target) : !!ignoreInputs;

    if (isInputElement(event.target) && !optedIn) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    matchingShortcut.action();
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  return { shortcuts };
}