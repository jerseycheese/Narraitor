import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Worlds comparison/table view — single-theme (default DS1).
 *
 * DS coverage (#1264): this spec exercises the grid/table toggle, selection
 * checkboxes, and comparison-view persistence behaviour, not theme layout. The
 * worlds list is covered across DS1/DS2/DS3 by tests/visual/worlds-themes.spec.ts.
 */

test.describe('World Comparison View', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await seedTestData(page);
    await page.goto('/worlds');
    await waitForContentStable(page);
  });

  test('should display table view with all columns and selection', async ({ page }) => {
    // Switch to table
    const tableBtn = page.getByRole('button', { name: 'Table view' });
    await tableBtn.click();
    await waitForContentStable(page);

    // Verify table is visible
    const table = page.getByRole('table', { name: 'Worlds table' });
    await expect(table).toBeVisible();

    // Verify toggle state
    await expect(tableBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'false');

    // Verify selection checkboxes work
    const checkboxes = page.getByRole('checkbox', { name: /Select .* for comparison/ });
    await checkboxes.first().click();
    await expect(checkboxes.first()).toBeChecked();

    // Single screenshot captures table with all columns
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('worlds-table-view.png', { fullPage: true });
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

  test('should maintain selection when switching views', async ({ page }) => {
    // Select in Grid view
    const checkboxes = page.getByRole('checkbox', { name: /Select .* for comparison/ });
    await checkboxes.first().click();

    // Switch to Table view
    await page.getByRole('button', { name: 'Table view' }).click();
    await waitForContentStable(page);

    // Verify first row is still checked
    const tableCheckboxes = page.getByRole('checkbox', { name: /Select .* for comparison/ });
    await expect(tableCheckboxes.first()).toBeChecked();
  });
});
