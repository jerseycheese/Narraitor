/**
 * Keyboard Navigation Utilities
 * 
 * Core utilities for handling keyboard navigation throughout the application.
 * Provides focus management, shortcut handling, and accessibility features.
 */

export type KeyboardShortcut = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  preventDefault?: boolean;
  description: string;
  category: 'navigation' | 'action' | 'modal' | 'game';
};

export type FocusableElement = HTMLElement & {
  focus(): void;
  blur(): void;
  tabIndex: number;
};

export type KeyboardNavigationOptions = {
  enableEscapeClose?: boolean;
  enableArrowKeys?: boolean;
  enableTabLoop?: boolean;
  skipHidden?: boolean;
  restoreFocus?: boolean;
};

/**
 * Gets all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): FocusableElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    '[role="button"]:not([disabled])',
    '[role="link"]:not([disabled])',
    '[role="menuitem"]:not([disabled])',
    '[role="tab"]:not([disabled])',
  ].join(', ');

  const elements = Array.from(container.querySelectorAll(focusableSelectors)) as FocusableElement[];
  
  return elements.filter(el => {
    // Skip hidden elements if requested
    const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
    const isNotHidden = !el.hasAttribute('hidden') && el.style.display !== 'none';
    return isVisible && isNotHidden;
  });
}

/**
 * Handles tab navigation within a container with optional looping
 */
export function handleTabNavigation(
  event: KeyboardEvent,
  container: HTMLElement,
  options: KeyboardNavigationOptions = {}
): boolean {
  const { enableTabLoop = true } = options;
  
  if (event.key !== 'Tab') return false;

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return false;

  const activeElement = document.activeElement as FocusableElement;
  const currentIndex = focusableElements.indexOf(activeElement);

  let nextIndex: number;
  
  if (event.shiftKey) {
    // Shift+Tab - go to previous element
    nextIndex = currentIndex <= 0 ? 
      (enableTabLoop ? focusableElements.length - 1 : 0) : 
      currentIndex - 1;
  } else {
    // Tab - go to next element
    nextIndex = currentIndex >= focusableElements.length - 1 ? 
      (enableTabLoop ? 0 : focusableElements.length - 1) : 
      currentIndex + 1;
  }

  const nextElement = focusableElements[nextIndex];
  if (nextElement) {
    event.preventDefault();
    nextElement.focus();
    return true;
  }

  return false;
}

/**
 * Handles arrow key navigation for lists and grids
 */
export function handleArrowNavigation(
  event: KeyboardEvent,
  container: HTMLElement,
  options: { 
    orientation?: 'horizontal' | 'vertical' | 'grid';
    columns?: number;
    wrap?: boolean;
  } = {}
): boolean {
  const { orientation = 'vertical', columns = 1, wrap = true } = options;
  
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    return false;
  }

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return false;

  const activeElement = document.activeElement as FocusableElement;
  const currentIndex = focusableElements.indexOf(activeElement);
  
  if (currentIndex === -1) return false;

  let nextIndex = currentIndex;

  switch (orientation) {
    case 'horizontal':
      if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : (wrap ? focusableElements.length - 1 : currentIndex);
      } else if (event.key === 'ArrowRight') {
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : (wrap ? 0 : currentIndex);
      }
      break;

    case 'vertical':
      if (event.key === 'ArrowUp') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : (wrap ? focusableElements.length - 1 : currentIndex);
      } else if (event.key === 'ArrowDown') {
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : (wrap ? 0 : currentIndex);
      }
      break;

    case 'grid':
      const currentRow = Math.floor(currentIndex / columns);
      const currentCol = currentIndex % columns;
      const totalRows = Math.ceil(focusableElements.length / columns);

      if (event.key === 'ArrowUp') {
        const newRow = currentRow > 0 ? currentRow - 1 : (wrap ? totalRows - 1 : currentRow);
        nextIndex = Math.min(newRow * columns + currentCol, focusableElements.length - 1);
      } else if (event.key === 'ArrowDown') {
        const newRow = currentRow < totalRows - 1 ? currentRow + 1 : (wrap ? 0 : currentRow);
        nextIndex = Math.min(newRow * columns + currentCol, focusableElements.length - 1);
      } else if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : (wrap ? focusableElements.length - 1 : currentIndex);
      } else if (event.key === 'ArrowRight') {
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : (wrap ? 0 : currentIndex);
      }
      break;
  }

  if (nextIndex !== currentIndex) {
    event.preventDefault();
    focusableElements[nextIndex]?.focus();
    return true;
  }

  return false;
}

/**
 * Creates a focus trap for modals and overlays
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Store the previously focused element
  const previouslyFocused = document.activeElement as HTMLElement;

  // Focus the first element
  firstElement?.focus();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    // Restore focus to previously focused element
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}

/**
 * Manages keyboard shortcuts with conflict detection
 */
export class KeyboardShortcutManager {
  private shortcuts = new Map<string, KeyboardShortcut & { handler: (event: KeyboardEvent) => void }>();
  private browserShortcuts = new Set([
    'Alt+ArrowLeft', 'Alt+ArrowRight', // Browser navigation
    'Ctrl+R', 'Meta+R', // Refresh
    'Ctrl+T', 'Meta+T', // New tab
    'Ctrl+W', 'Meta+W', // Close tab
    'Ctrl+L', 'Meta+L', // Address bar
    'Ctrl+F', 'Meta+F', // Find
    'Ctrl+U', 'Meta+Option+U', // View source
    'F5', 'Ctrl+F5', 'Meta+Shift+R', // Refresh variations
    'F11', // Fullscreen
    'F12', // Developer tools
  ]);

  private getShortcutKey(shortcut: Omit<KeyboardShortcut, 'description' | 'category'>): string {
    const modifiers = [];
    if (shortcut.altKey) modifiers.push('Alt');
    if (shortcut.ctrlKey) modifiers.push('Ctrl');
    if (shortcut.metaKey) modifiers.push('Meta');
    if (shortcut.shiftKey) modifiers.push('Shift');
    
    return `${modifiers.join('+')}${modifiers.length > 0 ? '+' : ''}${shortcut.key}`;
  }

  register(
    shortcut: KeyboardShortcut,
    handler: (event: KeyboardEvent) => void
  ): () => void {
    const shortcutKey = this.getShortcutKey(shortcut);
    
    // Check for browser shortcut conflicts
    if (this.browserShortcuts.has(shortcutKey)) {
      console.warn(`Keyboard shortcut ${shortcutKey} conflicts with browser shortcut`);
    }

    // Check for existing shortcut conflicts
    if (this.shortcuts.has(shortcutKey)) {
      console.warn(`Keyboard shortcut ${shortcutKey} is already registered`);
    }

    this.shortcuts.set(shortcutKey, { ...shortcut, handler });

    // Return unregister function
    return () => {
      this.shortcuts.delete(shortcutKey);
    };
  }

  handle(event: KeyboardEvent): boolean {
    const shortcutKey = this.getShortcutKey({
      key: event.key,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    });

    const shortcut = this.shortcuts.get(shortcutKey);
    if (shortcut) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.handler(event);
      return true;
    }

    return false;
  }

  getShortcuts(): Array<KeyboardShortcut & { shortcutKey: string }> {
    return Array.from(this.shortcuts.entries()).map(([shortcutKey, shortcut]) => ({
      ...shortcut,
      shortcutKey,
    }));
  }

  getShortcutsByCategory(category: KeyboardShortcut['category']): Array<KeyboardShortcut & { shortcutKey: string }> {
    return this.getShortcuts().filter(shortcut => shortcut.category === category);
  }
}

/**
 * Global keyboard shortcut manager instance
 */
export const globalShortcutManager = new KeyboardShortcutManager();

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Announces text to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  /**
   * Checks if an element is focusable
   */
  isFocusable(element: HTMLElement): boolean {
    const focusableElements = getFocusableElements(document.body);
    return focusableElements.includes(element as FocusableElement);
  },

  /**
   * Gets the currently focused element
   */
  getCurrentFocus(): HTMLElement | null {
    return document.activeElement as HTMLElement;
  },

  /**
   * Moves focus to the next focusable element
   */
  focusNext(container: HTMLElement = document.body): boolean {
    const focusableElements = getFocusableElements(container);
    const currentFocus = this.getCurrentFocus();
    const currentIndex = currentFocus ? focusableElements.indexOf(currentFocus as FocusableElement) : -1;
    
    const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
    const nextElement = focusableElements[nextIndex];
    
    if (nextElement) {
      nextElement.focus();
      return true;
    }
    
    return false;
  },

  /**
   * Moves focus to the previous focusable element
   */
  focusPrevious(container: HTMLElement = document.body): boolean {
    const focusableElements = getFocusableElements(container);
    const currentFocus = this.getCurrentFocus();
    const currentIndex = currentFocus ? focusableElements.indexOf(currentFocus as FocusableElement) : -1;
    
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
    const prevElement = focusableElements[prevIndex];
    
    if (prevElement) {
      prevElement.focus();
      return true;
    }
    
    return false;
  },
};