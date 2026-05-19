import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

test.describe('Mobile Action Row Layout', () => {
  const themes = ['ds1', 'ds2', 'ds3'] as const;
  const mobileViewports = [
    { name: 'narrow-mobile', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 667 },
  ] as const;

  const expectNoHorizontalOverflow = async (
    page: Page,
    theme: string,
    width: number,
    selector?: string
  ) => {
    const overflow = await page.evaluate((targetSelector) => {
      const doc = document.documentElement;
      const body = document.body;
      const target = targetSelector ? document.querySelector(targetSelector) : null;

      const results = {
        docScrollWidth: doc.scrollWidth,
        docClientWidth: doc.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
        targetScrollWidth: target ? target.scrollWidth : 0,
        targetClientWidth: target ? target.clientWidth : 0,
        hasOverflow: false,
      };

      results.hasOverflow =
        doc.scrollWidth > doc.clientWidth ||
        body.scrollWidth > body.clientWidth ||
        (target ? target.scrollWidth > target.clientWidth : false);

      return results;
    }, selector);

    console.log(
      `Overflow results for ${theme} at ${width}px:`,
      JSON.stringify(overflow, null, 2)
    );

    expect(
      overflow.hasOverflow,
      `Should not have horizontal overflow in ${theme} at ${width}px`
    ).toBe(false);
  };

  for (const theme of themes) {
    for (const viewport of mobileViewports) {
      test(`Mobile action row should not have horizontal overflow in ${theme} at ${viewport.width}px`, async ({ page }) => {
        // Seed test data and mock APIs
        await seedTestData(page);
        await mockApiEndpoints(page);

        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Go to play page
        await page.goto('/worlds/world-cyberpunk-2077/play');

        // Set theme
        await page.evaluate((t) => {
          localStorage.setItem('narraitor-theme', t);
          document.documentElement.setAttribute('data-theme', t);
        }, theme);

        await page.reload();

        // Wait for the main manuscript shell to load
        await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 15000 });

        // Check if suggested actions are present
        await expect(page.locator('.manuscript-suggested-action').first()).toBeVisible();

        // Check for horizontal overflow
        await expectNoHorizontalOverflow(page, theme, viewport.width, '#manuscript-action-rail');
      });

      test(`World detail action row should not have horizontal overflow in ${theme} at ${viewport.width}px`, async ({ page }) => {
        await seedTestData(page);

        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        await page.goto('/worlds/world-cyberpunk-2077');

        await page.evaluate((t) => {
          localStorage.setItem('narraitor-theme', t);
          document.documentElement.setAttribute('data-theme', t);
        }, theme);

        await page.reload();

        await page.waitForFunction(
          () => (window as typeof window & { __TEST_STORES_SEEDED__?: boolean }).__TEST_STORES_SEEDED__ === true,
          { timeout: 15000 }
        );

        await expect(page.getByRole('button', { name: 'Play in World' })).toBeVisible();

        await expectNoHorizontalOverflow(page, theme, viewport.width);
      });
    }
  }
});
