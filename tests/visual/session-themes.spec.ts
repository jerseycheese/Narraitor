import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { hideDynamicContent, waitForContentStable } from './utils/wait-helpers';
import { readSessionStageLayout } from './utils/manuscript-helpers';

/**
 * Game-session theme differentiation (#1225 + #986).
 *
 * The play surface must read as a structurally distinct product per DS, and
 * the Scene Status surface (characters present + current location, #986) must
 * render across all three themes from the latest narrative segment.
 *
 * Each theme positions Scene Status differently — DS1 keeps it as a left rail,
 * DS2 as an ambient line above the journal column, DS3 as a compact console bar
 * above a single column. These are asserted by geometry/computed style rather
 * than only by pixels, and the Scene Status surface itself is captured with a
 * locator screenshot (stable local <-> CI, unlike fullPage rail framing).
 *
 * Theme is set via localStorage before load (the play overlay has no on-page
 * theme switcher); ThemeProvider reads `narraitor-theme` on init.
 */

const APP_SESSION_URL = '/worlds/world-cyberpunk-2077/play';
const THEMES = ['ds1', 'ds2', 'ds3'] as const;
type ThemeId = (typeof THEMES)[number];

const setupSession = async (page: Page, theme: ThemeId): Promise<void> => {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('narraitor-theme', t);
    } catch {
      /* storage unavailable */
    }
  }, theme);

  await seedTestData(page);
  await mockApiEndpoints(page);
  await page.goto(APP_SESSION_URL);
  await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 60000 });
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-theme') === t,
    theme,
    { timeout: 10000 },
  );
  await page.waitForSelector('.component-scene-status', { timeout: 10000 });
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
};

test.describe('Game session theme differentiation', () => {
  for (const theme of THEMES) {
    test(`${theme} desktop: scene status renders and is themed`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1024 });
      await setupSession(page, theme);

      // #986: scene status reflects the latest segment (participants + location).
      const sceneStatus = page.locator('.component-scene-status').first();
      await expect(sceneStatus).toBeVisible();
      await expect(sceneStatus.getByText('Characters Present')).toBeVisible();
      await expect(sceneStatus.getByText('Location')).toBeVisible();

      const geo = await readSessionStageLayout(page);
      expect(geo).not.toBeNull();
      if (!geo) throw new Error('expected session layout nodes');

      // #1325: layout-invariant assertions for the composed session stage, per
      // theme. These catch intended-layout drift (like the DS2/DS3 grid split
      // fixed in PR #1324) regardless of any screenshot baseline — a baseline
      // bakes in whatever production renders first, so it can't flag a
      // pre-existing structural bug; an invariant can.
      if (theme === 'ds1') {
        // DS1: three-column stage with scene status as a rail LEFT of the column.
        expect(geo.trackCount).toBe(3);
        expect(geo.railLeft).toBeLessThan(geo.mainLeft);
      } else {
        // DS2/DS3: single-column stage with scene status STACKED ABOVE the
        // narrative. The #1324 regression left the narrative in grid-column 2,
        // splitting the stage into a too-wide rail + cramped column instead.
        expect(geo.trackCount).toBe(1);
        expect(geo.railTop).toBeLessThan(geo.mainTop);
      }

      // DS3 alone paints the mechanical dot grid on the shell.
      if (theme === 'ds3') {
        expect(geo.shellBg).toContain('radial-gradient');
      } else {
        expect(geo.shellBg).not.toContain('radial-gradient');
      }

      await expect(sceneStatus).toHaveScreenshot(`scene-status-${theme}-desktop.png`);
    });

    test(`${theme} mobile: scene status renders`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await setupSession(page, theme);

      const sceneStatus = page.locator('.component-scene-status').first();
      await expect(sceneStatus).toBeVisible();
      await expect(sceneStatus.getByText('Characters Present')).toBeVisible();

      // On mobile every theme stacks scene status above the narrative.
      const geo = await readSessionStageLayout(page);
      expect(geo).not.toBeNull();
      if (!geo) throw new Error('expected session layout nodes');
      expect(geo.railTop).toBeLessThanOrEqual(geo.mainTop + 4);

      await expect(sceneStatus).toHaveScreenshot(`scene-status-${theme}-mobile.png`);
    });
  }
});
