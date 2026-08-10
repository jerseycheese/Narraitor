import { test, expect } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { waitForStableScrollHeight } from './utils/wait-helpers';

/**
 * CLS (Cumulative Layout Shift) Measurement Test
 *
 * Validates that the styled game session surface achieves CLS < 0.10
 * across multiple cold-load iterations. Uses the PerformanceObserver API
 * to accumulate layout-shift entries, excluding user-input-driven shifts
 * per the standard CLS definition.
 *
 * Related issues: #1033 (streaming stability), #1055 (final CLS sign-off)
 *
 * DS coverage (#1264): single-theme by design — this is a performance/CLS metric
 * test, not a visual baseline, so per-theme captures add no signal. The play
 * surface's per-theme visuals are covered by tests/visual/session-themes.spec.ts
 * and tests/visual/design-system-session.spec.ts.
 */

const ROUTE = '/worlds/world-cyberpunk-2077/play';
const CLS_THRESHOLD = 0.1;
const NUM_ITERATIONS = 3;

// A turn is stricter than a cold load: the reader is mid-sentence, so the
// surface should not move at all while the next beat generates.
const TURN_CLS_THRESHOLD = 0.05;

test.describe('CLS Measurement - Game Session Surface', () => {
  test('CLS stays below 0.10 across cold-load iterations', async ({ browser }) => {
    test.setTimeout(120_000);

    const results: { run: number; cls: number; entries: Array<{ value: number; startTime: number; sources: string[] }> }[] = [];

    for (let i = 0; i < NUM_ITERATIONS; i++) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 1024 },
      });
      const page = await context.newPage();

      try {
        // Inject CLS observer before any navigation so it captures all shifts
        await page.addInitScript(() => {
          (window as any).__CLS_SCORE__ = 0;
          (window as any).__CLS_ENTRIES__ = [];

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutEntry = entry as PerformanceEntry & {
                hadRecentInput: boolean;
                value: number;
                sources?: Array<{ node?: Node }>;
              };
              // Standard CLS: exclude shifts caused by recent user input
              if (layoutEntry.hadRecentInput) continue;

              (window as any).__CLS_SCORE__ += layoutEntry.value;
              (window as any).__CLS_ENTRIES__.push({
                value: layoutEntry.value,
                startTime: layoutEntry.startTime,
                sources: (layoutEntry.sources || []).map((s) => {
                  const node = s.node;
                  if (!node || !(node as Element).tagName) return 'unknown';
                  const el = node as Element;
                  const tag = el.tagName.toLowerCase();
                  const id = el.id ? `#${el.id}` : '';
                  const cls = el.className && typeof el.className === 'string'
                    ? `.${el.className.split(' ').slice(0, 2).join('.')}`
                    : '';
                  return `${tag}${id}${cls}`;
                }),
              });
            }
          });

          observer.observe({ type: 'layout-shift', buffered: true });
        });

        // Seed data and mock APIs
        await seedTestData(page);
        await mockApiEndpoints(page);

        // Navigate to the game session route
        await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });

        // Wait for the session shell to appear
        await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
          timeout: 15_000,
        });

        // Wait for narrative segments to render
        try {
          await page.waitForSelector('.narrative-segment', { timeout: 10_000 });
        } catch {
          // Segments may not render if fixture data doesn't match — continue measurement
        }

        // Wait for scroll height to stabilize (1s stable duration)
        await waitForStableScrollHeight(page, { timeout: 10_000, stableDuration: 1000 });

        // Extra settling buffer for ResizeObserver cascades
        await page.waitForTimeout(2000);

        // Collect CLS results
        const cls = await page.evaluate(() => (window as any).__CLS_SCORE__ as number);
        const entries = await page.evaluate(
          () => (window as any).__CLS_ENTRIES__ as Array<{ value: number; startTime: number; sources: string[] }>
        );

        results.push({ run: i + 1, cls, entries });

        console.log(`--- CLS Run ${i + 1} ---`);
        console.log(`  Score: ${cls.toFixed(4)}`);
        if (entries.length > 0) {
          entries.forEach((e, idx) => {
            console.log(`  Shift ${idx + 1}: value=${e.value.toFixed(4)} time=${e.startTime.toFixed(0)}ms sources=[${e.sources.join(', ')}]`);
          });
        } else {
          console.log('  No layout shifts detected.');
        }

        expect(cls).toBeLessThan(CLS_THRESHOLD);
      } finally {
        await context.close();
      }
    }

    // Summary
    const avg = results.reduce((sum, r) => sum + r.cls, 0) / results.length;
    const max = Math.max(...results.map((r) => r.cls));
    console.log('\n=== CLS Summary ===');
    console.log(`  Runs: ${results.length}`);
    console.log(`  Scores: ${results.map((r) => r.cls.toFixed(4)).join(', ')}`);
    console.log(`  Average: ${avg.toFixed(4)}`);
    console.log(`  Max: ${max.toFixed(4)}`);
    console.log(`  Threshold: ${CLS_THRESHOLD}`);
    console.log(`  Result: ${max < CLS_THRESHOLD ? 'PASS' : 'FAIL'}`);
  });

  test('taking a turn does not move the narrative viewport', async ({ page }) => {
    test.setTimeout(120_000);

    // Every shift counts here, including the ones inside the click's
    // hadRecentInput window — a rail that resizes 200ms after the tap still
    // moves the sentence the reader is on.
    await page.addInitScript(() => {
      const w = window as unknown as {
        __TURN_CLS__: number;
        __TURN_SHIFTS__: Array<{ value: number; sources: string[] }>;
      };
      w.__TURN_CLS__ = 0;
      w.__TURN_SHIFTS__ = [];

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            value: number;
            sources?: Array<{ node?: Node }>;
          };
          w.__TURN_CLS__ += shift.value;
          w.__TURN_SHIFTS__.push({
            value: shift.value,
            sources: (shift.sources || []).map((source) => {
              const el = source.node as Element | undefined;
              if (!el?.tagName) return 'unknown';
              const id = el.id ? `#${el.id}` : '';
              const cls =
                typeof el.className === 'string' && el.className
                  ? `.${el.className.split(' ').slice(0, 2).join('.')}`
                  : '';
              return `${el.tagName.toLowerCase()}${id}${cls}`;
            }),
          });
        }
      }).observe({ type: 'layout-shift', buffered: false });
    });

    await seedTestData(page);
    // Delays hold the skeleton and streaming states on screen long enough for
    // any resize they cause to register.
    await mockApiEndpoints(page, { narrativeDelayMs: 800, choicesDelayMs: 800 });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 15_000 });
    await page.locator('.manuscript-suggested-action').first().waitFor({ timeout: 15_000 });
    await waitForStableScrollHeight(page, { timeout: 10_000, stableDuration: 1000 });
    await page.waitForTimeout(1500);

    const railBefore = await page.locator('#manuscript-action-rail').boundingBox();
    const mainBefore = await page.locator('.manuscript-overlay-main').boundingBox();

    // Zero the counter so only the turn is measured.
    await page.evaluate(() => {
      const w = window as unknown as { __TURN_CLS__: number; __TURN_SHIFTS__: unknown[] };
      w.__TURN_CLS__ = 0;
      w.__TURN_SHIFTS__.length = 0;
    });

    await page.locator('.manuscript-suggested-action').first().click();

    // Ride out the skeleton and streaming phases, then let the new choices land.
    await page.waitForSelector('.manuscript-choices-skeleton', { timeout: 15_000 }).catch(() => {});
    await page.waitForSelector('.manuscript-choices-skeleton', { state: 'detached', timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(2500);

    const turnCls = await page.evaluate(
      () => (window as unknown as { __TURN_CLS__: number }).__TURN_CLS__
    );
    const shifts = await page.evaluate(
      () => (window as unknown as { __TURN_SHIFTS__: Array<{ value: number; sources: string[] }> }).__TURN_SHIFTS__
    );

    console.log(`--- Turn CLS: ${turnCls.toFixed(4)} (${shifts.length} shifts) ---`);
    shifts.forEach((shift, index) => {
      console.log(`  Shift ${index + 1}: ${shift.value.toFixed(4)} [${shift.sources.join(', ')}]`);
    });

    const railAfter = await page.locator('#manuscript-action-rail').boundingBox();
    const mainAfter = await page.locator('.manuscript-overlay-main').boundingBox();

    expect(turnCls).toBeLessThanOrEqual(TURN_CLS_THRESHOLD);
    expect(railAfter?.height).toBeCloseTo(railBefore?.height ?? 0, 0);
    expect(mainAfter?.height).toBeCloseTo(mainBefore?.height ?? 0, 0);
  });

  // The rail reserves a fixed height, so anything past it is simply cut off.
  // At 375px that used to be the composer: its input and send button sat below
  // the reserve with no scroll affordance, which left writing a custom action
  // with no reachable control at all.
  test('the composer stays on screen at 375px', async ({ page }) => {
    test.setTimeout(120_000);

    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 15_000 });
    await page.locator('.manuscript-suggested-action').first().waitFor({ timeout: 15_000 });
    await waitForStableScrollHeight(page, { timeout: 10_000, stableDuration: 1000 });

    const rail = page.locator('#manuscript-action-rail');
    const composer = page.locator('#manuscript-action-rail .manuscript-input-row');
    const choiceList = page.locator('#manuscript-action-rail .manuscript-suggested-actions-section');

    const railBox = await rail.boundingBox();
    const composerBox = await composer.boundingBox();
    expect(composerBox!.y + composerBox!.height).toBeLessThanOrEqual(railBox!.y + railBox!.height + 1);

    // The choice list, not the rail, is what absorbs a long turn.
    const overflow = await choiceList.evaluate((el) => el.scrollHeight > el.clientHeight);
    const railOverflow = await rail.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
    expect(overflow).toBe(true);
    expect(railOverflow).toBe(false);

    // Scrolling to the end of the choices must not carry the composer with it.
    const composerBefore = await composer.boundingBox();
    await choiceList.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const composerAfter = await composer.boundingBox();
    expect(composerAfter?.y).toBeCloseTo(composerBefore?.y ?? 0, 0);
  });
});
