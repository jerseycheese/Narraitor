'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Roving-tabindex behaviour for a group of buttons that acts as one control
 * cluster (the WAI-ARIA toolbar pattern).
 *
 * Without it every button in the cluster is its own tab stop, so a keyboard
 * player crossing an 8-button HUD pays eight presses before reaching the story.
 * With it the cluster is a single stop and arrow keys move inside it.
 *
 * Tabindex is written straight onto the DOM nodes rather than threaded through
 * each button's props, so callers only wrap the container.
 */
export function useRovingToolbar<T extends HTMLElement>(): {
  toolbarRef: React.RefObject<T | null>;
  onKeyDown: (event: React.KeyboardEvent<T>) => void;
  onFocus: (event: React.FocusEvent<T>) => void;
} {
  const toolbarRef = useRef<T>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const getButtons = useCallback(
    () =>
      Array.from(
        toolbarRef.current?.querySelectorAll<HTMLButtonElement>(
          'button:not([disabled])'
        ) ?? []
      ),
    []
  );

  // No dependency array on purpose: buttons mount and unmount with the session
  // (drawer triggers, save indicator), and each render has to leave exactly one
  // of whatever is currently there in the tab cycle.
  useEffect(() => {
    const buttons = getButtons();
    if (buttons.length === 0) return;
    const target = Math.min(activeIndex, buttons.length - 1);
    buttons.forEach((button, index) => {
      button.tabIndex = index === target ? 0 : -1;
    });
  });

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<T>) => {
      const buttons = getButtons();
      if (buttons.length === 0) return;

      const current = buttons.indexOf(
        document.activeElement as HTMLButtonElement
      );
      if (current === -1) return;

      let next: number;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = (current + 1) % buttons.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          next = (current - 1 + buttons.length) % buttons.length;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = buttons.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      setActiveIndex(next);
      buttons[next].focus();
    },
    [getButtons]
  );

  // Clicking or shift-tabbing into a button makes it the cluster's tab stop, so
  // leaving and returning lands on the control last used rather than the first.
  const onFocus = useCallback(
    (event: React.FocusEvent<T>) => {
      const index = getButtons().indexOf(
        event.target as unknown as HTMLButtonElement
      );
      if (index !== -1) {
        setActiveIndex(index);
      }
    },
    [getButtons]
  );

  return { toolbarRef, onKeyDown, onFocus };
}
