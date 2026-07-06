import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';

/**
 * Journal page — per-theme coverage (#1264).
 *
 * All-DS companion to journal-page.spec.ts (single-theme, behaviour-focused:
 * proves entries seed and the detail pane opens). This spec proves the journal
 * surface itself renders in DS1/DS2/DS3. Locator-scoped to `.journal-page` so
 * the capture stays stable local <-> CI.
 *
 * The play routes have no on-page DS switcher, so theme is set via localStorage
 * before load (ThemeProvider reads `narraitor-theme` on init), matching
 * session-themes.spec.ts. Snapshot names are literals (one test per theme) so
 * scripts/clean-visual-snapshots.cjs keeps the committed baselines.
 */

const JOURNAL_URL = '/worlds/world-cyberpunk-2077/play/journal';
type ThemeId = 'ds1' | 'ds2' | 'ds3';

const setupJournal = async (page: Page, theme: ThemeId): Promise<void> => {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('narraitor-theme', t);
    } catch {
      /* storage unavailable */
    }
  }, theme);

  await seedTestData(page);
  await mockApiEndpoints(page);
  await page.goto(JOURNAL_URL);
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForFunction(() => {
    const testWindow = window as typeof window & { __TEST_JOURNAL_SEEDED__?: boolean };
    return Boolean(testWindow.__TEST_JOURNAL_SEEDED__);
  });
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-theme') === t,
    theme,
    { timeout: 10000 }
  );
  await expect(page.getByTestId('journal-list-pane')).toBeVisible({ timeout: 10000 });
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
};

test.describe('Journal page theme differentiation', () => {
  test('DS1 journal page renders consistently', async ({ page }) => {
    await setupJournal(page, 'ds1');
    await expect(page.locator('.journal-page')).toHaveScreenshot('journal-ds1.png');
  });

  test('DS2 journal page renders consistently', async ({ page }) => {
    await setupJournal(page, 'ds2');
    await expect(page.locator('.journal-page')).toHaveScreenshot('journal-ds2.png');
  });

  test('DS3 journal page renders consistently', async ({ page }) => {
    await setupJournal(page, 'ds3');
    await expect(page.locator('.journal-page')).toHaveScreenshot('journal-ds3.png');
  });
});
