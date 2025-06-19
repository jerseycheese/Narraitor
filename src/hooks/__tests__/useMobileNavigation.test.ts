import { renderHook, act } from '@testing-library/react';
import { useMobileNavigation } from '../useMobileNavigation';

describe('useMobileNavigation', () => {
  test('initializes with menu closed', () => {
    const { result } = renderHook(() => useMobileNavigation());
    
    expect(result.current.isMenuOpen).toBe(false);
  });

  test('can toggle menu state', () => {
    const { result } = renderHook(() => useMobileNavigation());
    
    act(() => {
      result.current.toggleMenu();
    });
    
    expect(result.current.isMenuOpen).toBe(true);
    
    act(() => {
      result.current.toggleMenu();
    });
    
    expect(result.current.isMenuOpen).toBe(false);
  });

  test('can open and close menu explicitly', () => {
    const { result } = renderHook(() => useMobileNavigation());
    
    act(() => {
      result.current.openMenu();
    });
    
    expect(result.current.isMenuOpen).toBe(true);
    
    act(() => {
      result.current.closeMenu();
    });
    
    expect(result.current.isMenuOpen).toBe(false);
  });

  test('detects mobile breakpoint correctly', () => {
    const { result } = renderHook(() => useMobileNavigation());
    
    // Should be mobile by default in test environment
    expect(result.current.isMobile).toBe(true);
  });
});