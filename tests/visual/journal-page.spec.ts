import { test, expect } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

/**
 * Journal Page Visual Test
 *
 * Tests that the dedicated journal page displays entries correctly
 * during an active game session.
 */

test.describe('Journal Page', () => {
  test('Should display journal entries on the journal page', async ({ page }) => {
    // Seed all necessary test data (worlds, characters, sessions, journal entries)
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Navigate to the play page
    await page.goto('/worlds/world-cyberpunk-2077/play');

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Look for journal floating button
    const journalButton = page.getByRole('button', { name: /open journal/i });
    await expect(journalButton).toBeVisible({ timeout: 10000 });

    // Click the journal button to open the journal page
    await Promise.all([
      page.waitForURL('**/play/journal', { timeout: 10000 }),
      journalButton.click(),
    ]);

    // Wait for journal page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await expect(page.getByTestId('journal-list-pane')).toBeVisible({ timeout: 10000 });
    const firstEntry = page.getByRole('button', { name: /select entry:/i }).first();
    await expect(firstEntry).toBeVisible({ timeout: 10000 });
    await firstEntry.click();
    await expect(
      page.getByTestId('journal-detail-pane').getByRole('heading', { name: /Adventure Begins/i })
    ).toBeVisible({ timeout: 10000 });

    // Verify journal page content is visible
    await expect(page.getByRole('heading', { level: 1, name: /Journal in/i })).toBeVisible();
    await expect(
      page.getByTestId('journal-list-pane').getByRole('heading', { name: 'Entries' })
    ).toBeVisible();

    // Take screenshot of journal page
    await page.waitForTimeout(500); // Let layout settle
    await expect(page).toHaveScreenshot('journal-page.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });
});
