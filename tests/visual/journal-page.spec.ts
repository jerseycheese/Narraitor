import { test, expect } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

/**
 * Journal Page Visual Test
 *
 * Tests that the dedicated journal page displays entries correctly
 * during an active game session.
 *
 * DS coverage (#1264): this spec is behaviour-focused (entries seed, detail pane
 * opens) and single-theme. The journal surface across DS1/DS2/DS3 is covered by
 * tests/visual/journal-themes.spec.ts.
 */

test.describe('Journal Page', () => {
  test('Should display journal entries on the journal page', async ({ page }) => {
    // Seed all necessary test data (worlds, characters, sessions, journal entries)
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Navigate directly to the journal page to avoid flaky UI transitions
    await page.goto('/worlds/world-cyberpunk-2077/play/journal');

    // Wait for journal page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Wait for journal entries to seed via runtime fixtures
    await page.waitForFunction(() => {
      const testWindow = window as typeof window & { __TEST_JOURNAL_SEEDED__?: boolean };
      return Boolean(testWindow.__TEST_JOURNAL_SEEDED__);
    });
    await expect(page.getByTestId('journal-list-pane')).toBeVisible({ timeout: 10000 });

    const entryButtons = page.getByRole('button', { name: /select entry:/i });
    await expect(entryButtons).toHaveCount(4, { timeout: 10000 });

    const worldEventEntry = page.getByRole('button', { name: 'Select entry: World Event' });
    await expect(worldEventEntry).toBeVisible({ timeout: 10000 });
    await worldEventEntry.click();
    await expect(
      page.getByTestId('journal-detail-pane').getByRole('heading', { name: 'World Event' })
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
