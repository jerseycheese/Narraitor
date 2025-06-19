import { renderHook, act } from '@testing-library/react';
import { useMobileNavigation } from '../useMobileNavigation';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query.includes('max-width: 768px'), // Simulate mobile
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('useMobileNavigation', () => {
  test('manages menu state correctly', () => {
    const { result } = renderHook(() => useMobileNavigation());
    
    // Initial state
    expect(result.current.isMenuOpen).toBe(false);
    
    // Test all state management functions
    act(() => {
      result.current.openMenu();
    });
    expect(result.current.isMenuOpen).toBe(true);
    
    act(() => {
      result.current.closeMenu();
    });
    expect(result.current.isMenuOpen).toBe(false);
    
    act(() => {
      result.current.toggleMenu();
    });
    expect(result.current.isMenuOpen).toBe(true);
    
    act(() => {
      result.current.toggleMenu();
    });
    expect(result.current.isMenuOpen).toBe(false);
  });

  test('detects mobile viewport correctly', () => {
    const { result } = renderHook(() => useMobileNavigation());
    
    // Should detect mobile breakpoint based on matchMedia mock
    expect(result.current.isMobile).toBe(true);
  });

  test('closes menu when Escape key is pressed', () => {
    const { result } = renderHook(() => useMobileNavigation());
    
    // Open menu first
    act(() => {
      result.current.openMenu();
    });
    expect(result.current.isMenuOpen).toBe(true);
    
    // Simulate Escape key press
    act(() => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
    });
    
    expect(result.current.isMenuOpen).toBe(false);
  });
});