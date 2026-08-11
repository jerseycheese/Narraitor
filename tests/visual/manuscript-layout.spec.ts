import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { hideDynamicContent, waitForImagesLoadedIn } from './utils/wait-helpers';

const resetPlaySurfaceScroll = async (page: Page) => {
  await page.evaluate(() => {
    const scroller = document.querySelector('.manuscript-overlay-main') as HTMLElement | null;
    scroller?.scrollTo({ top: 0, behavior: 'auto' });
  });
  await page.waitForTimeout(50);
};

/**
 * Manuscript Layout Specific Visual Tests
 * 
 * Verifies the specific components and interactions unique to the 
 * single-column manuscript layout, including the skeleton state
 * and floating HUD interactions.
 */

test.describe('Manuscript Layout Specific Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER PAGE ERROR: ${err.message}`));
  });

  test('Manuscript Skeleton should render consistently', async ({ page }) => {
    // Seed full data
    await seedTestData(page);
    await mockApiEndpoints(page);
    
    await page.goto('/worlds/world-cyberpunk-2077/play');

    // Wait for initial load
    await page.waitForSelector('[data-testid="manuscript-session-shell"]');

    // Manually trigger skeleton by clearing segments in store
    await page.evaluate(() => {
      if ((window as any).useNarrativeStore) {
        const sessionId = 'session-cyberpunk-ghost';
        const store = (window as any).useNarrativeStore;
        store.setState({
          sessionSegments: { [sessionId]: [] }
        });
      }
    });
    
    // Wait for skeleton test anchor
    await page.waitForSelector('[data-testid="game-session-skeleton"]', { state: 'attached', timeout: 5000 });
    
    // Slight wait for any animations to settle
    await page.waitForTimeout(500);
    
    await hideDynamicContent(page);
    
    await expect(page).toHaveScreenshot('manuscript-skeleton.png', {
      fullPage: true,
    });
  });

  test('Desktop character panel opens as a floating overlay near expected width', async ({ page }) => {
    // Seed full test data including narrative segments
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');

    // Wait for the main manuscript shell to load
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 10000 });
    await page.waitForTimeout(150);
    await resetPlaySurfaceScroll(page);

    const hudToggle = page.locator('.manuscript-hud-character-pill');
    await expect(hudToggle).toBeVisible();
    await hudToggle.click();

    await page.waitForSelector('.manuscript-hud-character-panel', {
      state: 'visible',
      timeout: 10000,
    });

    // DS3's character panel is a floating dropdown anchored below the
    // character pill (`.manuscript-hud-panel`: position: absolute; top: 100%;
    // width: min(var(--manuscript-rail-width, 18rem), calc(100vw - 1.5rem))).
    // The DS1-only rail-width-sync effect this test used to wait on (a
    // ResizeObserver in ManuscriptSessionShell gated on `theme === 'ds1'`) was
    // dead code for DS3 even before it was deleted this refactor, so there's
    // no async sync to race here — the layout is settled as soon as the panel
    // mounts.
    const desktopLayout = await page.evaluate(() => {
      const header = document.querySelector('.manuscript-overlay-header');
      const panel = document.querySelector('.manuscript-hud-character-panel');

      if (!header || !panel) {
        return null;
      }

      const headerRect = header.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      return {
        panelWidth: Math.round(panelRect.width),
        panelPosition: window.getComputedStyle(panel).position,
        panelTopAtOrBelowHeader: panelRect.top >= headerRect.bottom - 1,
      };
    });

    expect(desktopLayout).not.toBeNull();
    if (!desktopLayout) {
      throw new Error('Expected desktop character panel and header to be present');
    }

    // Measured live against the DS3 app at 1280px wide: the panel resolves to
    // its CSS fallback of 18rem (288px at the default 16px root font-size).
    // Assert a generous range instead of the exact px value so the check
    // isn't brittle against minor rendering differences across runners.
    expect(desktopLayout.panelWidth).toBeGreaterThan(200);
    expect(desktopLayout.panelWidth).toBeLessThanOrEqual(400);
    expect(desktopLayout.panelPosition).toBe('absolute');
    expect(desktopLayout.panelTopAtOrBelowHeader).toBe(true);

    await hideDynamicContent(page);

    // The panel leads with a character portrait, and the header carries three
    // more. Without this wait the capture races them: the diff grew 804 ->
    // 5732 -> 6536 px across one run's retries, all of it portrait pixels, so
    // the baseline recorded whichever frame won. The rails test below already
    // waits this way.
    await waitForImagesLoadedIn(page, '[data-testid="manuscript-session-shell"]');

    await expect(page).toHaveScreenshot('manuscript-hud-expanded.png');
  });

  test('Desktop and mobile rails should render in expected positions', async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');

    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 10000 });
    await page.waitForTimeout(150);
    await resetPlaySurfaceScroll(page);

    await expect(page.locator('[data-testid="manuscript-session-shell"]')).toBeVisible();
    await expect(page.locator('[data-testid="manuscript-decision-block"]')).toBeVisible();

    await expect(page.getByRole('button', { name: /close/i })).toBeVisible();

    // DS3 stacks the scene-status rail as a compact console bar above the
    // narrative (`.manuscript-characters-rail { display: block;
    // margin-bottom: var(--space-3); }`), not beside it — the old
    // DS1 three-column "rail to the left of main" layout doesn't apply here.
    const desktopLayout = await page.evaluate(() => {
      const rail = document.querySelector('.manuscript-characters-rail');
      const mainContent = document.querySelector('.manuscript-main-content');
      if (!rail || !mainContent) return null;

      const railRect = rail.getBoundingClientRect();
      const mainRect = mainContent.getBoundingClientRect();
      return {
        railDisplay: window.getComputedStyle(rail).display,
        // Small tolerance for subpixel rounding; measured live this gap is ~28px.
        railIsAboveMain: railRect.bottom <= mainRect.top + 2,
      };
    });

    expect(desktopLayout).not.toBeNull();
    if (!desktopLayout) {
      throw new Error('Expected desktop manuscript rail and content to be present');
    }
    expect(desktopLayout.railDisplay).not.toBe('none');
    expect(desktopLayout.railIsAboveMain).toBe(true);

    await hideDynamicContent(page);
    // The scene-status rail's character portrait can lose the load race against
    // the capture, leaving an empty avatar circle — a 331-pixel flip between
    // otherwise identical runs, and the only nondeterminism measured anywhere in
    // the chromium suite.
    await waitForImagesLoadedIn(page, '[data-testid="manuscript-session-shell"]');

    await expect(page).toHaveScreenshot('manuscript-full-composition.png', {
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 10000 });

    const mobileLayout = await page.evaluate(() => {
      const rail = document.querySelector('.manuscript-characters-rail');
      const decisionBlock = document.querySelector('#manuscript-decision-block');
      const choiceCount = document.querySelectorAll('.manuscript-suggested-action').length;

      if (!rail || !decisionBlock) return null;

      return {
        railDisplay: window.getComputedStyle(rail).display,
        decisionBlockDisplay: window.getComputedStyle(decisionBlock).display,
        choiceCount,
      };
    });

    expect(mobileLayout).not.toBeNull();
    if (!mobileLayout) {
      throw new Error('Expected mobile manuscript rail and decision block to be present');
    }

    // Scene status (the rail) now renders on mobile too, stacked above the
    // narrative, replacing the old DS1-only mobile bar.
    expect(mobileLayout.railDisplay).not.toBe('none');
    expect(mobileLayout.decisionBlockDisplay).not.toBe('none');
    expect(mobileLayout.choiceCount).toBeGreaterThan(0);
  });
});
