import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockAction: jest.Mock;
  let mockEscapeAction: jest.Mock;

  beforeEach(() => {
    mockAction = jest.fn();
    mockEscapeAction = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('handles keyboard shortcuts properly', () => {
    const shortcuts = [
      {
        key: 'Escape',
        action: mockEscapeAction,
        description: 'Close dialog or go back',
      },
      {
        key: 'j',
        action: mockAction,
        description: 'Open journal',
      }
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Test that shortcut functionality works by triggering events
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    const jEvent = new KeyboardEvent('keydown', { key: 'j', bubbles: true });

    act(() => {
      document.dispatchEvent(escapeEvent);
    });
    expect(mockEscapeAction).toHaveBeenCalled();

    act(() => {
      document.dispatchEvent(jEvent);
    });
    expect(mockAction).toHaveBeenCalled();
  });

  test('handles Escape key to close dialogs and modals', () => {
    const shortcuts = [
      {
        key: 'Escape',
        action: mockEscapeAction,
        description: 'Close modal',
      }
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Create and dispatch a real keyboard event
    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    act(() => {
      document.dispatchEvent(keydownEvent);
    });

    expect(mockEscapeAction).toHaveBeenCalled();
  });

  test('supports modifier keys for shortcuts', () => {
    const shortcuts = [
      {
        key: 'k',
        ctrlKey: true,
        action: mockAction,
        description: 'Open command palette',
      }
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Ctrl+K
    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    act(() => {
      document.dispatchEvent(keydownEvent);
    });

    expect(mockAction).toHaveBeenCalled();
  });

  test('can be disabled and re-enabled', () => {
    const shortcuts = [
      {
        key: 'Escape',
        action: mockEscapeAction,
        description: 'Close modal',
      }
    ];

    const { rerender } = renderHook(
      ({ enabled }) => useKeyboardShortcuts(shortcuts, enabled),
      { initialProps: { enabled: true } }
    );

    // Disable shortcuts
    rerender({ enabled: false });

    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    act(() => {
      document.dispatchEvent(keydownEvent);
    });

    // Should not trigger when disabled
    expect(mockEscapeAction).not.toHaveBeenCalled();

    // Re-enable shortcuts
    rerender({ enabled: true });

    act(() => {
      document.dispatchEvent(keydownEvent);
    });

    // Should trigger when re-enabled
    expect(mockEscapeAction).toHaveBeenCalled();
  });

  test('hook can be unmounted without errors', () => {
    const shortcuts = [
      {
        key: 'Escape',
        action: mockEscapeAction,
        description: 'Close modal',
      }
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
  });

  test('ignores shortcuts when input elements are focused', () => {
    const shortcuts = [
      {
        key: 'j',
        action: mockAction,
        description: 'Open journal',
      }
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Create and focus an input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // Dispatch event from input element directly

    act(() => {
      // Dispatch the event from the input element directly
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'j',
        bubbles: true,
      }));
    });

    // Should not trigger when input is focused and should be ignored
    expect(mockAction).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  test('returns current shortcuts for inspection', () => {
    const shortcuts = [
      {
        key: 'Escape',
        action: mockEscapeAction,
        description: 'Close modal',
      },
      {
        key: 'j',
        action: mockAction,
        description: 'Open journal',
      }
    ];

    const { result } = renderHook(() => useKeyboardShortcuts(shortcuts));

    expect(result.current.shortcuts).toEqual(shortcuts);
  });

  test('prevents default behavior when specified', () => {
    const shortcuts = [
      {
        key: 'Escape',
        action: mockEscapeAction,
        description: 'Close modal',
      }
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const preventDefaultSpy = jest.fn();
    const stopPropagationSpy = jest.fn();

    // Manually trigger the event handler
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      
      // Override the methods
      Object.defineProperty(event, 'preventDefault', {
        value: preventDefaultSpy,
        writable: true,
      });
      Object.defineProperty(event, 'stopPropagation', {
        value: stopPropagationSpy,
        writable: true,
      });
      
      document.dispatchEvent(event);
    });

    expect(mockEscapeAction).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});