import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, waitForImagesLoadedIn } from './utils/wait-helpers';
import { seedTestData, seedBaseData } from './utils/seedTestData';

/**
 * Dashboard Visual Regression Tests
 *
 * NOTE: the committed baselines are the CI runner's render, not a local one.
 * Full-page heights and any text rows take their height from OS-rendered font
 * metrics, which differ between a dev machine and the CI macOS image, so a
 * locally-generated baseline drifts against CI. To refresh these snapshots,
 * take the actuals from a CI E2E run rather than regenerating with
 * `--update-snapshots` locally. See commit 2fe3941a for the original
 * rationale.
 */

test.describe('Dashboard Visual Tests', () => {
  // The app home moved from / to /dashboard (#1528; / is now the public
  // landing page, covered by landing-page.spec.ts). These two dashboard tests
  // navigate to the canonical route directly; the CI-adopted baseline names
  // (home-*.png) are kept because the rendered pixels are unchanged.
  test('Dashboard should render consistently (empty state)', async ({ page }) => {
    // Use base seeding for empty state - much faster than clearing everything manually
    await seedBaseData(page);

    await page.goto('/dashboard');
    await waitForContentStable(page);
    // Empty state routes to GuidedFirstTimeExperience, whose "First time?"
    // title renders in the italic Newsreader webfont (--font-narrative,
    // next/font with display: 'swap'). Without waiting for the swap, an
    // occasional slow font fetch leaves fallback-font glyphs painted at
    // screenshot time, producing thousands of pixels of diff - the same wait
    // other specs already do (e.g. world-creation.spec.ts,
    // landing-page.spec.ts).
    await page.evaluate(() => document.fonts.ready);
    await hideDynamicContent(page);

    // Verify page loaded with expected content
    await expect(page).toHaveTitle(/Narraitor/i);

    // Take full page screenshot - empty QuickPlay form
    await expect(page).toHaveScreenshot('home-empty-state.png', {
      fullPage: true,
    });
  });

  test('Dashboard should render consistently', async ({ page }) => {
    // Seed test data to show returning user with recent game session
    await seedTestData(page);
    await page.goto('/dashboard');
    // Wait for seeding to complete before stabilizing
    await page.waitForFunction(() => {
      const testWindow = window as typeof window & { __TEST_STORES_SEEDED__?: boolean };
      return Boolean(testWindow.__TEST_STORES_SEEDED__);
    }, { timeout: 15000 });

    // Reload to ensure localStorage is picked up cleanly
    await page.reload();

    await waitForContentStable(page);
    // Same webfont-swap flake as the empty-state test above: the world/character
    // names in the Continue card render in the italic Newsreader webfont
    // (--font-narrative, next/font with display: 'swap'), so an occasional slow
    // font fetch leaves fallback-font glyphs painted at screenshot time.
    await page.evaluate(() => document.fonts.ready);
    await hideDynamicContent(page);
    // Ensure the Continue section appears (seeded session present)
    await page.waitForSelector('[aria-labelledby="continue-session-heading"]', { timeout: 8000 });

    // Verify page loaded with expected content
    await expect(page).toHaveTitle(/Narraitor/i);

    // Take full page screenshot - should show "Continue Last Session" with character and world info
    await waitForImagesLoadedIn(page, 'main');
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
    });
  });

  test('Dashboard should render consistently (dark mode)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('narraitor-color-scheme', 'dark');
    });
    await seedTestData(page);
    await page.goto('/dashboard');
    await page.waitForFunction(() => {
      const testWindow = window as typeof window & { __TEST_STORES_SEEDED__?: boolean };
      return Boolean(testWindow.__TEST_STORES_SEEDED__);
    }, { timeout: 15000 });

    await page.reload();
    await waitForContentStable(page);
    await page.evaluate(() => document.fonts.ready);
    await hideDynamicContent(page);
    await page.waitForSelector('[aria-labelledby="continue-session-heading"]', { timeout: 8000 });

    await expect(page).toHaveTitle(/Narraitor/i);

    await waitForImagesLoadedIn(page, 'main');
    await expect(page).toHaveScreenshot('home-page-dark.png', {
      fullPage: true,
    });
  });

  test('Dashboard should render consistently (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await seedTestData(page);
    await page.goto('/dashboard');
    await page.waitForFunction(() => {
      const testWindow = window as typeof window & { __TEST_STORES_SEEDED__?: boolean };
      return Boolean(testWindow.__TEST_STORES_SEEDED__);
    }, { timeout: 15000 });

    await page.reload();
    await waitForContentStable(page);
    await page.evaluate(() => document.fonts.ready);
    await hideDynamicContent(page);
    await page.waitForSelector('[aria-labelledby="continue-session-heading"]', { timeout: 8000 });

    await expect(page).toHaveTitle(/Narraitor/i);

    await waitForImagesLoadedIn(page, 'main');
    await expect(page).toHaveScreenshot('home-page-mobile.png', {
      fullPage: true,
    });
  });
});
