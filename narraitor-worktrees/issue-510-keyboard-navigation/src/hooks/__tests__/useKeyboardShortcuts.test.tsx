import { renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts - Essential Keyboard Support', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    document.removeEventListener('keydown', jest.fn());
  });

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('keydown', jest.fn());
  });

  it('calls escape handler when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const mockEscapeHandler = jest.fn();
    
    renderHook(() => useKeyboardShortcuts({
      onEscape: mockEscapeHandler
    }));
    
    await user.keyboard('{Escape}');
    
    expect(mockEscapeHandler).toHaveBeenCalledTimes(1);
  });

  it('does not call escape handler when other keys are pressed', async () => {
    const user = userEvent.setup();
    const mockEscapeHandler = jest.fn();
    
    renderHook(() => useKeyboardShortcuts({
      onEscape: mockEscapeHandler
    }));
    
    await user.keyboard('{Enter}');
    await user.keyboard('{Tab}');
    await user.keyboard('a');
    
    expect(mockEscapeHandler).not.toHaveBeenCalled();
  });

  it('supports multiple keyboard shortcuts', async () => {
    const user = userEvent.setup();
    const mockEscapeHandler = jest.fn();
    const mockEnterHandler = jest.fn();
    
    renderHook(() => useKeyboardShortcuts({
      onEscape: mockEscapeHandler,
      onEnter: mockEnterHandler
    }));
    
    await user.keyboard('{Escape}');
    await user.keyboard('{Enter}');
    
    expect(mockEscapeHandler).toHaveBeenCalledTimes(1);
    expect(mockEnterHandler).toHaveBeenCalledTimes(1);
  });

  it('cleans up event listeners on unmount', () => {
    const mockEscapeHandler = jest.fn();
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = renderHook(() => useKeyboardShortcuts({
      onEscape: mockEscapeHandler
    }));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('prevents default behavior when specified', async () => {
    const user = userEvent.setup();
    const mockEscapeHandler = jest.fn();
    
    renderHook(() => useKeyboardShortcuts({
      onEscape: mockEscapeHandler
    }, { preventDefault: true }));
    
    const preventDefaultSpy = jest.fn();
    
    // Mock keyboard event
    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    mockEvent.preventDefault = preventDefaultSpy;
    
    act(() => {
      document.dispatchEvent(mockEvent);
    });
    
    expect(mockEscapeHandler).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
  });

  it('handles disabled state correctly', async () => {
    const user = userEvent.setup();
    const mockEscapeHandler = jest.fn();
    
    const { rerender } = renderHook(
      ({ disabled }) => useKeyboardShortcuts({
        onEscape: mockEscapeHandler
      }, { disabled }),
      { initialProps: { disabled: false } }
    );
    
    // Should work when enabled
    await user.keyboard('{Escape}');
    expect(mockEscapeHandler).toHaveBeenCalledTimes(1);
    
    // Should not work when disabled
    rerender({ disabled: true });
    await user.keyboard('{Escape}');
    expect(mockEscapeHandler).toHaveBeenCalledTimes(1); // Still 1, not 2
  });
});