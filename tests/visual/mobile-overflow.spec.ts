import { test, expect } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

test.describe('Mobile Action Row Layout', () => {
  const themes = ['ds1', 'ds2', 'ds3'] as const;
  const mobileViewports = [
    { name: 'narrow-mobile', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 667 },
  ] as const;

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
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          const rail = document.querySelector('#manuscript-action-rail');

          const results = {
            docScrollWidth: doc.scrollWidth,
            docClientWidth: doc.clientWidth,
            bodyScrollWidth: body.scrollWidth,
            bodyClientWidth: body.clientWidth,
            railScrollWidth: rail ? rail.scrollWidth : 0,
            railClientWidth: rail ? rail.clientWidth : 0,
            hasOverflow: false
          };

          results.hasOverflow = doc.scrollWidth > doc.clientWidth ||
                               body.scrollWidth > body.clientWidth ||
                               (rail ? rail.scrollWidth > rail.clientWidth : false);

          return results;
        });

        console.log(`Overflow results for ${theme} at ${viewport.width}px:`, JSON.stringify(overflow, null, 2));

        expect(overflow.hasOverflow, `Should not have horizontal overflow in ${theme} at ${viewport.width}px`).toBe(false);
      });
    }
  }
});
