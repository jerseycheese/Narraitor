import { test, expect, type Page } from '@playwright/test';

// Probes read computed style off elements injected directly into the DOM
// (rather than a live app screen) so the assertion is about the CSS contract
// in globals.css, not about which page happens to render these classes.
const probeAnimation = (page: Page, className: string) =>
  page.evaluate((cls) => {
    const el = document.createElement('div');
    el.className = cls;
    document.body.appendChild(el);
    const style = getComputedStyle(el);
    const raw = style.animationDuration.split(',')[0].trim();
    const durationMs = raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000;
    const iterationCount = style.animationIterationCount.split(',')[0].trim();
    el.remove();
    return { durationMs, iterationCount };
  }, className);

test.describe('prefers-reduced-motion (#1678)', () => {
  test.describe('with reduce-motion enabled', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('stops the rotating and sliding animations', async ({ page }) => {
      await page.goto('/');

      const dieTick = await probeAnimation(page, 'manuscript-evaluating-die');
      const drawerSlide = await probeAnimation(page, 'manuscript-drawer-panel');

      expect(dieTick.durationMs).toBeLessThan(1);
      expect(drawerSlide.durationMs).toBeLessThan(1);
    });

    test('keeps opacity-only "still working" indicators looping instead of freezing', async ({ page }) => {
      await page.goto('/');

      const streamingDot = await probeAnimation(page, 'manuscript-streaming-dot');
      const loadingDot = await probeAnimation(page, 'component-loading-dot');

      expect(streamingDot.iterationCount).toBe('infinite');
      expect(streamingDot.durationMs).toBeGreaterThan(1);
      expect(loadingDot.iterationCount).toBe('infinite');
      expect(loadingDot.durationMs).toBeGreaterThan(1);
    });
  });

  test('runs at full speed when the OS has no motion preference set', async ({ page }) => {
    await page.goto('/');

    const dieTick = await probeAnimation(page, 'manuscript-evaluating-die');

    expect(dieTick.iterationCount).toBe('infinite');
    expect(dieTick.durationMs).toBeGreaterThan(1000);
  });
});
