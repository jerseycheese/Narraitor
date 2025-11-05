import { test, expect } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

/**
 * Journal Modal Visual Test
 *
 * Tests that the journal modal displays entries correctly
 * during an active game session.
 */

test.describe('Journal Modal', () => {
  test('Should display journal entries in modal', async ({ page }) => {
    // Seed all necessary test data (worlds, characters, sessions, journal entries)
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Navigate to the play page
    await page.goto('/worlds/world-cyberpunk-2077/play');

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Wait for active game session
    await page.waitForSelector('[data-testid="game-session-active"]', { timeout: 10000 });

    // Look for journal floating button
    const journalButton = page.getByRole('button', { name: /open journal/i });
    await expect(journalButton).toBeVisible({ timeout: 10000 });

    // Click the journal button to open the modal
    await journalButton.click();

    // Wait for journal modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Verify journal modal is visible
    const journalModal = page.locator('[role="dialog"]');
    await expect(journalModal).toBeVisible();

    // Take screenshot of journal modal
    await page.waitForTimeout(500); // Let modal animation complete
    await expect(page).toHaveScreenshot('journal-modal.png', {
      fullPage: false,
      threshold: 0.3,
    });
  });
});
