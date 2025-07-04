import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockAction: jest.Mock;
  let mockEscapeAction: jest.Mock;

  beforeEach(() => {
    mockAction = jest.fn();
    mockEscapeAction = jest.fn();
    
    // Clear all event listeners
    document.removeEventListener = jest.fn();
    document.addEventListener = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('registers keyboard shortcuts including Escape', () => {
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

    expect(document.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });

  test('handles Escape key to close dialogs and modals', () => {
    const shortcuts = [
      {
        key: 'Escape',
        action: mockEscapeAction,
        description: 'Close modal',
      }
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Escape key press
    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    act(() => {
      document.dispatchEvent(keydownEvent);
    });

    expect(mockEscapeAction).toHaveBeenCalled();
    
    unmount();
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

  test('cleans up event listeners on unmount', () => {
    const shortcuts = [
      {
        key: 'Escape',
        action: mockEscapeAction,
        description: 'Close modal',
      }
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
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

    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'j',
      bubbles: true,
      target: input,
    } as EventInit);

    act(() => {
      document.dispatchEvent(keydownEvent);
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
    
    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    
    // Mock preventDefault and stopPropagation
    Object.defineProperty(keydownEvent, 'preventDefault', {
      value: preventDefaultSpy,
    });
    Object.defineProperty(keydownEvent, 'stopPropagation', {
      value: stopPropagationSpy,
    });

    act(() => {
      document.dispatchEvent(keydownEvent);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});