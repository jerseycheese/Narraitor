import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Character table/grid view — single-theme (default DS1).
 *
 * DS coverage (#1264): this spec exercises the grid/table view-toggle and
 * persistence behaviour, not theme layout. The characters roster is covered
 * across DS1/DS2/DS3 by tests/visual/characters-themes.spec.ts.
 */

test.describe('Character Table View', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await seedTestData(page);
    await page.goto('/characters');
    await waitForContentStable(page);
  });

  test('should display table view with all columns and elements', async ({ page }) => {
    // Switch to table
    const tableBtn = page.getByRole('button', { name: 'Table view' });
    await tableBtn.click();
    await waitForContentStable(page);

    const table = page.getByRole('table', { name: 'Characters table' });
    await expect(table).toBeVisible();

    // Verify all column headers
    await expect(table.getByRole('button', { name: 'Name' })).toBeVisible();
    await expect(table.getByRole('button', { name: 'Level' })).toBeVisible();
    await expect(table.getByRole('button', { name: 'Type' })).toBeVisible();
    await expect(table.getByRole('button', { name: 'Created' })).toBeVisible();
    await expect(table.getByText('Actions')).toBeVisible();

    // Verify portraits render
    await expect(page.locator('.component-character-portrait').first()).toBeVisible();

    // Verify action buttons
    await expect(page.getByRole('button', { name: /View/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Play as/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Edit/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Delete/ }).first()).toBeVisible();

    // Verify type badges
    await expect(page.locator('text=/Known Figure|Original/').first()).toBeVisible();

    // Single screenshot captures all elements
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('characters-table-view.png', { fullPage: true });
  });

  test('should toggle between grid and table view', async ({ page }) => {
    const gridBtn = page.getByRole('button', { name: 'Grid view' });
    const tableBtn = page.getByRole('button', { name: 'Table view' });

    // Default is grid
    await expect(gridBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch to table
    await tableBtn.click();
    await waitForContentStable(page);
    await expect(page.getByRole('table', { name: 'Characters table' })).toBeVisible();
    await expect(tableBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch back to grid
    await gridBtn.click();
    await waitForContentStable(page);
    await expect(page.locator('.component-character-card').first()).toBeVisible();
    await expect(gridBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('should persist view mode preference', async ({ page }) => {
    // Switch to table view
    await page.getByRole('button', { name: 'Table view' }).click();
    await waitForContentStable(page);
    await expect(page.getByRole('table', { name: 'Characters table' })).toBeVisible();

    // Reload page
    await page.reload();
    await waitForContentStable(page);

    // Verify table view persisted
    await expect(page.getByRole('table', { name: 'Characters table' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Table view' })).toHaveAttribute('aria-pressed', 'true');
  });
});
