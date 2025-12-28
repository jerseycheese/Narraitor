import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

test.describe('World Comparison View', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await seedTestData(page);
    await page.goto('/worlds');
    await waitForContentStable(page);
  });

  test('should toggle between grid and table view', async ({ page }) => {
    // Check toggle buttons exist
    const gridBtn = page.getByRole('button', { name: 'Grid view' });
    const tableBtn = page.getByRole('button', { name: 'Table view' });
    
    await expect(gridBtn).toBeVisible();
    await expect(tableBtn).toBeVisible();
    
    // Default is grid
    await expect(gridBtn).toHaveAttribute('aria-pressed', 'true');
    
    // Switch to table
    await tableBtn.click();
    await waitForContentStable(page);
    
    // Verify table is visible
    await expect(page.getByRole('table', { name: 'Worlds table' })).toBeVisible();
    await expect(tableBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(gridBtn).toHaveAttribute('aria-pressed', 'false');
    
    // Screenshot table view
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('worlds-table-view.png', { fullPage: true });
    
    // Switch back to grid
    await gridBtn.click();
    await waitForContentStable(page);
    await expect(page.getByTestId('world-list-container')).toBeVisible();
  });

  test('should handle selection in table view', async ({ page }) => {
    // Switch to table
    await page.getByRole('button', { name: 'Table view' }).click();
    await waitForContentStable(page);
    
    // Select first two rows
    const checkboxes = page.getByRole('checkbox', { name: /Select .* for comparison/ });
    // Note: getByRole('checkbox') might return the "Select All" checkbox in header too.
    // The name regex helps filter, but "Select all worlds" vs "Select [Name] for comparison".
    // My regex /Select .* for comparison/ should exclude "Select all worlds".
    
    await checkboxes.first().click();
    await checkboxes.nth(1).click();
    
    // Verify selection state (checked)
    await expect(checkboxes.first()).toBeChecked();
    await expect(checkboxes.nth(1)).toBeChecked();
    
    // Screenshot with selection
    await hideDynamicContent(page);
    await expect(page).toHaveScreenshot('worlds-table-selection.png', { fullPage: true });
  });

  test('should maintain selection when switching views', async ({ page }) => {
    // Select in Grid view
    const checkboxes = page.getByRole('checkbox', { name: /Select .* for comparison/ });
    await checkboxes.first().click();
    
    // Switch to Table view
    await page.getByRole('button', { name: 'Table view' }).click();
    await waitForContentStable(page);
    
    // Verify first row is checked
    const tableCheckboxes = page.getByRole('checkbox', { name: /Select .* for comparison/ });
    
    await expect(tableCheckboxes.first()).toBeChecked(); 
    // Assuming first in grid is first in table.
  });
});
