import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import {
  waitForContentStable,
  hideDynamicContent,
  expandAllCollapsibleSections,
} from './utils/wait-helpers';

/**
 * Ending screen — per-theme coverage (#1264).
 *
 * All-DS companion to ending-screen.spec.ts, which captures the four emotional
 * tones (triumphant/tragic/mysterious/hopeful) in a single theme. Tone is a
 * content variant; the structural surface is the same, so one tone (triumphant)
 * per design system is enough to prove the ending screen renders in DS1/DS2/DS3.
 * Locator-scoped to `[data-testid="ending-screen"]` for local <-> CI stability.
 *
 * The play route has no on-page DS switcher, so theme is set via localStorage
 * before load, matching session-themes.spec.ts. Snapshot names are literals (one
 * test per theme) so scripts/clean-visual-snapshots.cjs keeps the committed
 * baselines.
 */

const PLAY_URL = '/worlds/world-cyberpunk-2077/play';
type ThemeId = 'ds1' | 'ds2' | 'ds3';

const ENDING_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iI2ZmZDcwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Ucml1bXBoYW50IEVuZGluZzwvdGV4dD48L3N2Zz4=';

const setupEnding = async (page: Page, theme: ThemeId): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('narraitor-theme', t);
    } catch {
      /* storage unavailable */
    }
  }, theme);

  await seedTestData(page);
  await mockApiEndpoints(page);

  // Deterministic triumphant ending (registered after mockApiEndpoints so it wins).
  await page.route('**/api/generate-ending-image', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { success: true, imageUrl: ENDING_IMAGE },
    });
  });
  await page.route('**/api/narrative/ending', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        success: true,
        data: {
          epilogue:
            'With the city liberated and the syndicate dismantled, your legend spreads through Neo-Tokyo. The skyline gleams brighter than ever.',
          characterLegacy:
            'Nova Ghost Chen becomes a symbol of resistance, inspiring a new generation of free minds.',
          worldImpact:
            'Corporate overreach is pushed back; citizens regain control over their data and lives.',
          tone: 'triumphant',
          achievements: ['Master Hacker: Outsmarted corporate AI', 'City Savior: Freed Neo-Tokyo'],
          playTime: 1234,
          imageUrl: ENDING_IMAGE,
        },
      },
    });
  });

  await page.goto(PLAY_URL);
  await waitForContentStable(page);
  await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 20000 });
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-theme') === t,
    theme,
    { timeout: 10000 }
  );

  const endButton = page.getByRole('button', { name: 'End Story' });
  await endButton.scrollIntoViewIfNeeded();
  await expect(endButton).toBeEnabled();
  await endButton.click();
  await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
  await page.locator('[role="dialog"] button:has-text("End Story")').click();

  await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });
  try {
    await page.waitForSelector('[data-testid="ending-screen"] img[alt*="ending for"]', {
      timeout: 5000,
    });
  } catch {
    // Image may still be loading; proceed.
  }
  await expandAllCollapsibleSections(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
  await waitForContentStable(page);
};

test.describe('Ending screen theme differentiation', () => {
  test.describe.configure({ timeout: 60000 });

  test('DS1 ending screen renders consistently', async ({ page }) => {
    await setupEnding(page, 'ds1');
    await expect(page.locator('[data-testid="ending-screen"]')).toHaveScreenshot(
      'ending-screen-ds1.png',
      { threshold: 0.05 }
    );
  });

  test('DS2 ending screen renders consistently', async ({ page }) => {
    await setupEnding(page, 'ds2');
    await expect(page.locator('[data-testid="ending-screen"]')).toHaveScreenshot(
      'ending-screen-ds2.png',
      { threshold: 0.05 }
    );
  });

  test('DS3 ending screen renders consistently', async ({ page }) => {
    await setupEnding(page, 'ds3');
    await expect(page.locator('[data-testid="ending-screen"]')).toHaveScreenshot(
      'ending-screen-ds3.png',
      { threshold: 0.05 }
    );
  });
});
