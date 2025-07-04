import { useEffect, useRef, useCallback } from 'react';
import { 
  KeyboardShortcut as BaseKeyboardShortcut, 
  globalShortcutManager,
  type KeyboardNavigationOptions,
  handleTabNavigation,
  handleArrowNavigation,
  createFocusTrap,
  focusUtils
} from '@/lib/accessibility/keyboardNavigation';

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

/**
 * Hook for registering enhanced keyboard shortcuts with global manager
 */
export function useEnhancedKeyboardShortcuts(
  shortcuts: Array<{
    shortcut: BaseKeyboardShortcut;
    handler: (event: KeyboardEvent) => void;
    enabled?: boolean;
  }>,
  dependencies: any[] = []
) {
  useEffect(() => {
    const unregisterFunctions: Array<() => void> = [];

    shortcuts.forEach(({ shortcut, handler, enabled = true }) => {
      if (enabled) {
        const unregister = globalShortcutManager.register(shortcut, handler);
        unregisterFunctions.push(unregister);
      }
    });

    return () => {
      unregisterFunctions.forEach(unregister => unregister());
    };
  }, dependencies);
}

/**
 * Hook for handling keyboard navigation within a container
 */
export function useKeyboardNavigation(
  options: KeyboardNavigationOptions & {
    containerRef?: React.RefObject<HTMLElement>;
    enabled?: boolean;
  } = {}
) {
  const {
    containerRef,
    enabled = true,
    enableEscapeClose = false,
    enableArrowKeys = false,
    enableTabLoop = true,
    skipHidden = true,
    restoreFocus = false
  } = options;

  const defaultContainerRef = useRef<HTMLElement>(null);
  const activeContainerRef = containerRef || defaultContainerRef;
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !activeContainerRef.current) return;

    const container = activeContainerRef.current;

    // Handle Escape key
    if (enableEscapeClose && event.key === 'Escape') {
      event.preventDefault();
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      // Dispatch custom escape event
      container.dispatchEvent(new CustomEvent('keyboard-escape', { bubbles: true }));
      return;
    }

    // Handle Tab navigation
    if (event.key === 'Tab') {
      handleTabNavigation(event, container, { enableTabLoop, skipHidden });
      return;
    }

    // Handle Arrow key navigation
    if (enableArrowKeys && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      handleArrowNavigation(event, container, { orientation: 'vertical', wrap: true });
      return;
    }
  }, [enabled, enableEscapeClose, enableArrowKeys, enableTabLoop, skipHidden, restoreFocus]);

  useEffect(() => {
    const container = activeContainerRef.current;
    if (!container || !enabled) return;

    // Store previous focus when component mounts
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    containerRef: activeContainerRef,
    restoreFocus: () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  };
}

/**
 * Hook for creating a focus trap in modals and overlays
 */
export function useFocusTrap(
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement>,
  options: {
    restoreFocus?: boolean;
    initialFocus?: React.RefObject<HTMLElement>;
  } = {}
) {
  const { restoreFocus = true, initialFocus } = options;
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    
    // Create focus trap
    const cleanup = createFocusTrap(container);
    cleanupRef.current = cleanup;

    // Focus initial element if specified
    if (initialFocus?.current) {
      initialFocus.current.focus();
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [isActive, initialFocus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);
}

/**
 * Hook for handling global keyboard shortcuts at the application level
 */
export function useGlobalKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Let the global shortcut manager handle the event
      globalShortcutManager.handle(event);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

/**
 * Hook for managing screen reader announcements
 */
export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    focusUtils.announce(message, priority);
  }, []);

  return {
    announce
  };
}

/**
 * Hook for managing focus within a list or grid
 */
export function useListNavigation(
  options: {
    containerRef?: React.RefObject<HTMLElement>;
    orientation?: 'horizontal' | 'vertical' | 'grid';
    columns?: number;
    wrap?: boolean;
    enabled?: boolean;
  } = {}
) {
  const {
    containerRef,
    orientation = 'vertical',
    columns = 1,
    wrap = true,
    enabled = true
  } = options;

  const defaultContainerRef = useRef<HTMLElement>(null);
  const activeContainerRef = containerRef || defaultContainerRef;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !activeContainerRef.current) return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      handleArrowNavigation(event, activeContainerRef.current, {
        orientation,
        columns,
        wrap
      });
    }
  }, [enabled, orientation, columns, wrap]);

  useEffect(() => {
    const container = activeContainerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    containerRef: activeContainerRef
  };
}

/**
 * Hook for handling number key shortcuts (1-9)
 */
export function useNumberKeyShortcuts(
  handlers: Array<{
    number: number;
    handler: () => void;
    enabled?: boolean;
  }>,
  dependencies: any[] = []
) {
  useEnhancedKeyboardShortcuts(
    handlers.map(({ number, handler, enabled = true }) => ({
      shortcut: {
        key: number.toString(),
        description: `Select option ${number}`,
        category: 'action' as const
      },
      handler: () => handler(),
      enabled
    })),
    dependencies
  );
}

/**
 * Hook for escape key handling
 */
export function useEscapeKey(
  handler: () => void,
  enabled: boolean = true
) {
  useEnhancedKeyboardShortcuts([{
    shortcut: {
      key: 'Escape',
      description: 'Close or cancel',
      category: 'modal'
    },
    handler,
    enabled
  }], [handler, enabled]);
}