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
 * session-themes.spec.ts.
 */

const JOURNAL_URL = '/worlds/world-cyberpunk-2077/play/journal';
const THEMES = ['ds1', 'ds2', 'ds3'] as const;
type ThemeId = (typeof THEMES)[number];

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
  for (const theme of THEMES) {
    test(`${theme} journal page renders consistently`, async ({ page }) => {
      await setupJournal(page, theme);
      await expect(page.locator('.journal-page')).toHaveScreenshot(`journal-${theme}.png`);
    });
  }
});
