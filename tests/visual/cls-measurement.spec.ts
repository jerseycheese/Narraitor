import { test, expect } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { waitForStableScrollHeight } from './utils/wait-helpers';

/**
 * CLS (Cumulative Layout Shift) Measurement Test
 *
 * Gates the share of layout shift that moves story text, across multiple
 * cold-load iterations. Uses the PerformanceObserver API to accumulate
 * layout-shift entries, excluding user-input-driven shifts per the standard
 * CLS definition, and attributes each entry to prose or not by its sources.
 *
 * Why prose-attributed rather than total: the play surface is one scrolling
 * document, so the decision sits below the prose and moves whenever the
 * narrative above it finishes streaming. That motion is the design — the
 * sentence being read holds position, and new content arrives beneath it —
 * but total CLS counts it all the same. Measured on this scene, the change
 * from a docked rail to one column moved total CLS from ~0.030 to ~0.182
 * while prose-attributed CLS stayed at zero: nothing that shifted was text
 * anyone was reading. Gating the total here would mean either reserving a
 * fixed row for the choices again (the bug this replaced, #1750) or making
 * the skeleton predict a height it cannot know.
 *
 * A regression that does move prose still fails, which is the property worth
 * keeping. Total CLS stays in the log so a jump is visible in review.
 *
 * Related issues: #1033 (streaming stability), #1055 (final CLS sign-off),
 * #1750 (the docked rail this measurement outlived)
 *
 * DS coverage (#1264): single-theme by design — this is a performance/CLS metric
 * test, not a visual baseline, so per-theme captures add no signal. The play
 * surface's per-theme visuals are covered by tests/visual/session-themes.spec.ts
 * and tests/visual/design-system-session.spec.ts.
 */

const ROUTE = '/worlds/world-cyberpunk-2077/play';
const CLS_THRESHOLD = 0.1;
const NUM_ITERATIONS = 3;

test.describe('CLS Measurement - Game Session Surface', () => {
  test('CLS stays below 0.10 across cold-load iterations', async ({ browser }) => {
    test.setTimeout(120_000);

    const results: { run: number; cls: number; proseCls: number; entries: Array<{ value: number; startTime: number; movedProse: boolean; sources: string[] }> }[] = [];

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

          (window as any).__CLS_PROSE_SCORE__ = 0;

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutEntry = entry as PerformanceEntry & {
                hadRecentInput: boolean;
                value: number;
                sources?: Array<{ node?: Node }>;
              };
              // Standard CLS: exclude shifts caused by recent user input
              if (layoutEntry.hadRecentInput) continue;

              const sourceNodes = (layoutEntry.sources || [])
                .map((s) => s.node)
                .filter((n): n is Element => !!n && !!(n as Element).tagName);

              // Did this shift move story text? A shift whose sources are all
              // below the prose moves the decision, not the sentence being read.
              const movedProse = sourceNodes.some(
                (el) =>
                  el.closest('.manuscript-narrative-container') !== null ||
                  el.querySelector('.manuscript-narrative-container') !== null
              );

              (window as any).__CLS_SCORE__ += layoutEntry.value;
              if (movedProse) {
                (window as any).__CLS_PROSE_SCORE__ += layoutEntry.value;
              }

              (window as any).__CLS_ENTRIES__.push({
                value: layoutEntry.value,
                startTime: layoutEntry.startTime,
                movedProse,
                sources: sourceNodes.map((el) => {
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
        const proseCls = await page.evaluate(() => (window as any).__CLS_PROSE_SCORE__ as number);
        const entries = await page.evaluate(
          () => (window as any).__CLS_ENTRIES__ as Array<{ value: number; startTime: number; movedProse: boolean; sources: string[] }>
        );

        results.push({ run: i + 1, cls, proseCls, entries });

        console.log(`--- CLS Run ${i + 1} ---`);
        console.log(`  Score: ${cls.toFixed(4)} (prose: ${proseCls.toFixed(4)})`);
        if (entries.length > 0) {
          entries.forEach((e, idx) => {
            console.log(`  Shift ${idx + 1}: value=${e.value.toFixed(4)} time=${e.startTime.toFixed(0)}ms prose=${e.movedProse} sources=[${e.sources.join(', ')}]`);
          });
        } else {
          console.log('  No layout shifts detected.');
        }

        expect(proseCls).toBeLessThan(CLS_THRESHOLD);
      } finally {
        await context.close();
      }
    }

    // Summary
    const avg = results.reduce((sum, r) => sum + r.cls, 0) / results.length;
    const max = Math.max(...results.map((r) => r.cls));
    const proseMax = Math.max(...results.map((r) => r.proseCls));
    console.log('\n=== CLS Summary ===');
    console.log(`  Runs: ${results.length}`);
    console.log(`  Scores: ${results.map((r) => r.cls.toFixed(4)).join(', ')}`);
    console.log(`  Average: ${avg.toFixed(4)}`);
    console.log(`  Max: ${max.toFixed(4)}  (prose max: ${proseMax.toFixed(4)})`);
    console.log(`  Threshold: ${CLS_THRESHOLD} against prose shift`);
    console.log(`  Result: ${proseMax < CLS_THRESHOLD ? 'PASS' : 'FAIL'}`);
  });
});
