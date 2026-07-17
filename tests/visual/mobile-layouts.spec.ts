import { test, expect, type Page } from '@playwright/test';
import {
  waitForContentStable,
  hideDynamicContent,
  pinAppShell,
  waitForImagesLoaded,
} from './utils/wait-helpers';
import { seedTestData, seedBarelyStartedData } from './utils/seedTestData';
import { waitForStoreReady } from './utils/tutorial-helpers';

/**
 * Mobile layout coverage (default DS1) — fills the responsive gap found in the
 * visual-regression audit. Almost the entire suite runs at desktop 1280×1024;
 * only session-themes and manuscript-breakpoints exercise a narrow viewport, so
 * the dashboard, worlds list, and character sheet had no mobile baseline.
 *
 * Captures the three surfaces whose layout restructures most at phone width
 * (375×812, matching session-themes): the dashboard step checklist stacks, the
 * worlds grid collapses to one column, and the character sheet's columns fold.
 * A regression in the mobile breakpoints surfaces as a diff here.
 *
 * NOTE: like the other full-page specs, the committed baselines are the CI
 * runner's render, not a local one — refresh from a CI E2E run rather than
 * regenerating locally (see main-pages.spec.ts).
 */

const MOBILE_VIEWPORT = { width: 375, height: 812 };

async function settle(page: Page): Promise<void> {
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await waitForImagesLoaded(page);
  await pinAppShell(page);
}

test.describe('Mobile layouts', () => {
  test('dashboard stacks at phone width', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await seedBarelyStartedData(page);
    // App home moved to /dashboard (#1528); / is the public landing page.
    await page.goto('/dashboard');
    await waitForContentStable(page);
    await page.waitForSelector('.component-dashboard-getting-started', { timeout: 8000 });
    await settle(page);
    await expect(page).toHaveScreenshot('mobile-dashboard.png', { fullPage: true });
  });

  test('worlds list collapses to one column at phone width', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await seedTestData(page);
    await page.goto('/worlds');
    await page.waitForFunction(
      () => (window as unknown as { __TEST_STORES_SEEDED__?: boolean }).__TEST_STORES_SEEDED__ === true,
      { timeout: 15000 }
    );
    await page.reload();
    await waitForContentStable(page);
    await page.waitForSelector('.worlds-screen', { timeout: 8000 });
    await settle(page);
    await expect(page).toHaveScreenshot('mobile-worlds-list.png', { fullPage: true });
  });

  test('character sheet folds at phone width', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await seedTestData(page);
    await page.goto('/characters/char-cyberpunk-hacker');
    await waitForStoreReady(page);
    await page.waitForSelector('.character-detail-body', { timeout: 8000 });
    await settle(page);
    await expect(page).toHaveScreenshot('mobile-character-detail.png', { fullPage: true });
  });
});
