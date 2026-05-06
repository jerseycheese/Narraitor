import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { openAppDrawer } from './utils/manuscript-helpers';

// The manuscript inventory drawer renders InventoryList (cards) only — InventoryTable
// and InventoryViewToggle are orphaned in production. Re-enable once #1181 is resolved
// (decision pending: re-wire the table view, or remove the orphaned components).
test.describe.skip('Inventory Table View', () => {
  test('should display inventory table with description column and large images', async ({ page }) => {
    test.setTimeout(60000);

    // Seed test data and navigate to game session
    await page.addInitScript(() => {
      window.localStorage.setItem('inventory-view-mode', 'table');
    });
    await seedTestData(page);
    await mockApiEndpoints(page);
    await page.goto('/worlds/world-cyberpunk-2077/play');

    // Wait for page to load
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // Continue if network doesn't idle
    }

    // Open the inventory drawer (seeds items + opens tools panel + clicks Inventory)
    await openAppDrawer(page, 'Inventory');
    await waitForContentStable(page);

    // localStorage sets table view, but click the toggle defensively in case the
    // preference didn't take effect on first render.
    const tableViewToggle = page.getByRole('button', { name: 'Table view' });
    if (await tableViewToggle.count() > 0) {
      await tableViewToggle.click();
      await page.waitForTimeout(200);
    }

    // Verify table is now visible
    const table = page.getByRole('table', { name: /Inventory table/ });
    await expect(table).toBeVisible({ timeout: 10000 });

    // Verify all columns are present (scope to table to avoid conflicts)
    await expect(table.getByRole('button', { name: 'Name' })).toBeVisible();
    await expect(table.getByText('Description')).toBeVisible();
    await expect(table.getByRole('button', { name: 'Quantity' })).toBeVisible();
    await expect(table.getByRole('button', { name: 'Category' })).toBeVisible();
    await expect(table.getByText('Source')).toBeVisible();
    await expect(table.getByText('Actions')).toBeVisible();

    // Verify item descriptions are visible (new column)
    await expect(page.getByText(/Signature deck tuned to slip past/)).toBeVisible();
    await expect(page.getByText(/Fast-acting injectors that keep reflexes/)).toBeVisible();

    // Verify images are rendered
    const itemImages = page.locator('.item-image');
    await expect(itemImages.first()).toBeVisible();

    // Verify action buttons
    await expect(page.getByRole('button', { name: /Use/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Drop/ }).first()).toBeVisible();

    // Take screenshot of the inventory table
    await hideDynamicContent(page);

    await expect(table).toHaveScreenshot('inventory-table-view.png', {
      animations: 'disabled',
    });
  });
});
