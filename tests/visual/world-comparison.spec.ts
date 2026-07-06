import { test, expect } from '@playwright/test';
import { waitForContentStable } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Worlds grid/table view toggle — single-theme (default DS1).
 *
 * Exercises the grid/table view toggle. The worlds list itself is covered
 * across DS1/DS2/DS3 by tests/visual/worlds-themes.spec.ts.
 */

test.describe('Worlds grid/table view', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await seedTestData(page);
    await page.goto('/worlds');
    await waitForContentStable(page);
  });

  test('should toggle between grid and table view', async ({ page }) => {
    const gridBtn = page.getByRole('button', { name: 'Grid view' });
    const tableBtn = page.getByRole('button', { name: 'Table view' });

    // Default is grid
    await expect(gridBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch to table
    await tableBtn.click();
    await waitForContentStable(page);
    await expect(page.getByRole('table', { name: 'Worlds table' })).toBeVisible();
    await expect(tableBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch back to grid
    await gridBtn.click();
    await waitForContentStable(page);
    await expect(page.getByTestId('world-list-container')).toBeVisible();
    await expect(gridBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
