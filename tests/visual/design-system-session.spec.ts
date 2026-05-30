import { test, expect } from '@playwright/test';
import { waitForContentStable } from './utils/wait-helpers';

/**
 * Design-system session showcase visual regression (issue #1276).
 *
 * The ds{1,2,3} session sections now render the one real session surface the
 * app ships — `ManuscriptSessionShell` with the real HUD, scene-status rail,
 * narrative history, and choice selector — via the shared SessionShowcase,
 * instead of three hand-built look-alikes. These tests launch the session per
 * theme and capture the shell so a change to the real session moves the
 * showcase baseline (and surfaces drift) instead of slipping past a fake.
 *
 * The shell is captured with a locator screenshot (not fullPage) so the capture
 * is bounded to the session surface and stays stable between a local Mac and
 * the CI macOS runner. The page forces the global theme so the shell themes to
 * the page.
 */

const VARIANTS = [
  { id: 'ds1', path: '/dev/design-system' },
  { id: 'ds2', path: '/dev/design-system/2' },
  { id: 'ds3', path: '/dev/design-system/3' },
] as const;

test.describe('Design system session showcase', () => {
  for (const { id, path } of VARIANTS) {
    test(`${id} renders the real game session surface`, async ({ page }) => {
      await page.goto(path);
      await waitForContentStable(page);

      const section = page.getByTestId('ds-session');
      await section.scrollIntoViewIfNeeded();
      await section.getByRole('button', { name: 'Enter the session' }).click();

      const shell = page.locator('[data-testid="manuscript-session-shell"]');
      await expect(shell).toBeVisible();
      // Real session chrome is present (not a look-alike).
      await expect(
        shell.getByText('Rain hammered the sidewalk outside the Alibi Room.', {
          exact: false,
        }),
      ).toBeVisible();

      // Hide the floating design-system variant switcher so it does not paint
      // over the full-screen shell in the capture.
      await page.addStyleTag({ content: '.ds-toggle { display: none; }' });
      // Let the DS1 rail/panel geometry sync settle before capture.
      await page.waitForTimeout(1200);

      await expect(shell).toHaveScreenshot(`ds-session-${id}.png`);
    });
  }
});
