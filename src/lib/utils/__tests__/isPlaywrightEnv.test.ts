import { isPlaywrightEnv } from '../isPlaywrightEnv';

describe('isPlaywrightEnv', () => {
  const originalWindow = global.window;
  const originalUserAgent = window.navigator.userAgent;

  afterEach(() => {
    if (global.window !== originalWindow) {
      (global as Record<string, unknown>).window = originalWindow;
    }
    if (typeof window !== 'undefined') {
      delete window.__PLAYWRIGHT__;
      Object.defineProperty(window.navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    }
  });

  it('returns false when window is undefined', () => {
    // @ts-expect-error simulating environment without a window global
    delete global.window;

    expect(isPlaywrightEnv()).toBe(false);
  });

  it('returns false when window is defined but __PLAYWRIGHT__ is not set (even if userAgent contains "Playwright")', () => {
    delete window.__PLAYWRIGHT__;
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Playwright)',
      configurable: true,
    });

    expect(isPlaywrightEnv()).toBe(false);
  });

  it('returns true when window.__PLAYWRIGHT__ is true', () => {
    window.__PLAYWRIGHT__ = true;

    expect(isPlaywrightEnv()).toBe(true);
  });

  it('returns false when window.__PLAYWRIGHT__ is false or null', () => {
    window.__PLAYWRIGHT__ = false;
    expect(isPlaywrightEnv()).toBe(false);

    // @ts-expect-error testing null runtime value
    window.__PLAYWRIGHT__ = null;
    expect(isPlaywrightEnv()).toBe(false);
  });
});
