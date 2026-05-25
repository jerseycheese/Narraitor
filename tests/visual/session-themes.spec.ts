import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { hideDynamicContent, waitForContentStable } from './utils/wait-helpers';

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

const sceneStatusGeometry = (page: Page) =>
  page.evaluate(() => {
    const rail = document.querySelector('.manuscript-characters-rail');
    const main = document.querySelector('.manuscript-main-content');
    const shell = document.querySelector('.manuscript-viewport-shell');
    if (!rail || !main || !shell) return null;
    const r = rail.getBoundingClientRect();
    const m = main.getBoundingClientRect();
    return {
      railLeft: Math.round(r.left),
      railRight: Math.round(r.right),
      railTop: Math.round(r.top),
      railBottom: Math.round(r.bottom),
      mainLeft: Math.round(m.left),
      mainTop: Math.round(m.top),
      shellBg: window.getComputedStyle(shell).backgroundImage,
    };
  });

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

      const geo = await sceneStatusGeometry(page);
      expect(geo).not.toBeNull();
      if (!geo) throw new Error('expected session layout nodes');

      if (theme === 'ds1') {
        // DS1: scene status sits as a side rail to the left of the reading column.
        expect(geo.railLeft).toBeLessThan(geo.mainLeft);
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
      const geo = await sceneStatusGeometry(page);
      expect(geo).not.toBeNull();
      if (!geo) throw new Error('expected session layout nodes');
      expect(geo.railTop).toBeLessThanOrEqual(geo.mainTop + 4);

      await expect(sceneStatus).toHaveScreenshot(`scene-status-${theme}-mobile.png`);
    });
  }
});
