import React from 'react';
import { render, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { STORAGE_KEY_THEME, STORAGE_KEY_COLOR_SCHEME } from '../index';

// Test component that exposes context values
function TestConsumer({ onRender }: { onRender: (ctx: ReturnType<typeof useTheme>) => void }) {
  const ctx = useTheme();
  onRender(ctx);
  return null;
}

function renderWithProvider(onRender: (ctx: ReturnType<typeof useTheme>) => void) {
  return render(
    <ThemeProvider>
      <TestConsumer onRender={onRender} />
    </ThemeProvider>
  );
}

describe('ThemeProvider', () => {
  let matchMediaListeners: Array<(e: { matches: boolean }) => void>;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
    matchMediaListeners = [];

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
          matchMediaListeners.push(handler);
        },
        removeEventListener: jest.fn(),
      })),
    });
  });

  it('defaults to ds1 and light mode', () => {
    let ctx: ReturnType<typeof useTheme> | null = null;
    renderWithProvider((c) => { ctx = c; });

    expect(ctx!.theme).toBe('ds1');
    expect(ctx!.colorScheme).toBe('light');
    expect(ctx!.resolvedColorScheme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('ds1');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setTheme updates data-theme attribute', () => {
    let ctx: ReturnType<typeof useTheme> | null = null;
    renderWithProvider((c) => { ctx = c; });

    act(() => { ctx!.setTheme('ds2'); });

    expect(ctx!.theme).toBe('ds2');
    expect(document.documentElement.getAttribute('data-theme')).toBe('ds2');
  });

  it('setColorScheme dark adds .dark class', () => {
    let ctx: ReturnType<typeof useTheme> | null = null;
    renderWithProvider((c) => { ctx = c; });

    act(() => { ctx!.setColorScheme('dark'); });

    expect(ctx!.colorScheme).toBe('dark');
    expect(ctx!.resolvedColorScheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('persists theme to localStorage', () => {
    let ctx: ReturnType<typeof useTheme> | null = null;
    renderWithProvider((c) => { ctx = c; });

    act(() => { ctx!.setTheme('ds3'); });

    expect(localStorage.getItem(STORAGE_KEY_THEME)).toBe('ds3');
  });

  it('persists color scheme to localStorage', () => {
    let ctx: ReturnType<typeof useTheme> | null = null;
    renderWithProvider((c) => { ctx = c; });

    act(() => { ctx!.setColorScheme('dark'); });

    expect(localStorage.getItem(STORAGE_KEY_COLOR_SCHEME)).toBe('dark');
  });

  it('reads stored values on mount', () => {
    localStorage.setItem(STORAGE_KEY_THEME, 'ds2');
    localStorage.setItem(STORAGE_KEY_COLOR_SCHEME, 'dark');

    let ctx: ReturnType<typeof useTheme> | null = null;
    renderWithProvider((c) => { ctx = c; });

    expect(ctx!.theme).toBe('ds2');
    expect(ctx!.colorScheme).toBe('dark');
  });

  it('theme and color scheme are independent', () => {
    let ctx: ReturnType<typeof useTheme> | null = null;
    renderWithProvider((c) => { ctx = c; });

    act(() => { ctx!.setTheme('ds3'); });
    act(() => { ctx!.setColorScheme('dark'); });

    expect(ctx!.theme).toBe('ds3');
    expect(ctx!.colorScheme).toBe('dark');

    act(() => { ctx!.setTheme('ds1'); });
    expect(ctx!.theme).toBe('ds1');
    expect(ctx!.colorScheme).toBe('dark');
  });

  it('system color scheme responds to matchMedia', () => {
    let ctx: ReturnType<typeof useTheme> | null = null;
    renderWithProvider((c) => { ctx = c; });

    act(() => { ctx!.setColorScheme('system'); });
    expect(ctx!.resolvedColorScheme).toBe('light');

    act(() => {
      matchMediaListeners.forEach((handler) => handler({ matches: true }));
    });
    expect(ctx!.resolvedColorScheme).toBe('dark');
  });

  it('throws when useTheme used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      function Bare() { useTheme(); return null; }
      render(<Bare />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});
