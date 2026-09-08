import { THEME_INIT_SCRIPT } from '../themeInitScript';

describe('THEME_INIT_SCRIPT', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  function executeInitScript(matchesDark: boolean) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-color-scheme: dark') ? matchesDark : false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });

    // Execute the string code via Function constructor to simulate inline script evaluation
    new Function(THEME_INIT_SCRIPT)();
  }

  it('adds dark class on first paint when prefers-color-scheme: dark and no explicit preference is set', () => {
    executeInitScript(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('does not add dark class on first paint when prefers-color-scheme is light and no explicit preference is set', () => {
    executeInitScript(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('adds dark class on first paint when color scheme is explicitly system and prefers-color-scheme is dark', () => {
    localStorage.setItem('narraitor-color-scheme', 'system');
    executeInitScript(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('adds dark class on first paint when color scheme is explicitly dark regardless of system preference', () => {
    localStorage.setItem('narraitor-color-scheme', 'dark');
    executeInitScript(false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('preserves explicit light preference on first paint even when prefers-color-scheme is dark', () => {
    localStorage.setItem('narraitor-color-scheme', 'light');
    executeInitScript(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('treats invalid or unrecognized stored scheme as system default on dark-mode OS', () => {
    localStorage.setItem('narraitor-color-scheme', 'invalid-scheme');
    executeInitScript(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
