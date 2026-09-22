import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, expandAllCollapsibleSections, pinAppShell } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

/**
 * Edit Pages Visual Regression Tests
 *
 * NOTE: the committed baselines are the CI runner's render, not a local one.
 * Full-page heights and any text rows take their height from OS-rendered font
 * metrics, which differ between a dev machine and the CI macOS image, so a
 * locally-generated baseline drifts against CI. To refresh these snapshots,
 * take the actuals from a CI E2E run rather than regenerating with
 * `--update-snapshots` locally. See commit 2fe3941a for the original
 * rationale.
 */

test.describe('Edit Pages Visual Tests', () => {
  test('World edit page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate directly to the edit page to avoid any list-page fallbacks
    await page.goto('/worlds/world-cyberpunk-2077/edit');
    await expect(page).toHaveURL(/\/worlds\/world-cyberpunk-2077\/edit/);
    await waitForContentStable(page);
    // Confirm editor root and sections present before expansion
    const editor = page.locator('[data-testid="world-editor-root"]');
    await editor.waitFor({ timeout: 8000 });
    await page.waitForSelector('[data-testid="collapsible-section"]', { timeout: 8000 });
    await hideDynamicContent(page);
    
    // Expand all CollapsibleSections to show full content (scoped to editor)
    await expandAllCollapsibleSections(page, editor);
    // Ensure no collapsed sections remain
    await expect(
      editor.locator('[data-testid="collapsible-section-toggle"]').filter({ hasText: '+' })
    ).toHaveCount(0);
    await pinAppShell(page);

    // Take screenshot of world edit page - should show world editing interface with all sections expanded
    await expect(page).toHaveScreenshot('world-edit.png', { fullPage: true });
  });

  test('Character edit page should render consistently', async ({ page }) => {
    test.setTimeout(45000); // Extended timeout for complex edit page with CollapsibleSections
    await seedTestData(page);
    
    // Navigate to character edit page
    await page.goto('/characters/char-cyberpunk-hacker/edit');
    await waitForContentStable(page);
    
    // Debug: Check if we're on the right page
    const pageTitle = await page.textContent('h1, [data-testid="page-title"], .page-title');
    console.log('Character edit page title:', pageTitle);
    
    // Wait for character data to load
    await page.waitForFunction(() => {
      return document.body.textContent && 
             !document.body.textContent.includes('Character not found') &&
             (document.body.textContent.includes('Edit Character') || document.body.textContent.includes('CharacterEditor'));
    }, { timeout: 10000 });
    
    await hideDynamicContent(page);
    
    // Debug: Check how many CollapsibleSections exist before expansion
    const totalSections = await page.locator('[data-testid="collapsible-section"]').count();
    console.log(`Found ${totalSections} total CollapsibleSections on character edit page`);
    
    // Debug: Check how many are collapsed before expansion
    const collapsedSections = await page.locator('[data-testid="collapsible-section-toggle"]').filter({
      hasText: '+'
    }).count();
    console.log(`Found ${collapsedSections} collapsed sections before expansion`);
    
    // Expand all CollapsibleSections to show full content
    await expandAllCollapsibleSections(page);
    
    // Debug: Check how many are still collapsed after expansion
    const stillCollapsed = await page.locator('[data-testid="collapsible-section-toggle"]').filter({
      hasText: '+'
    }).count();
    console.log(`Found ${stillCollapsed} collapsed sections after expansion`);
    await pinAppShell(page);

    // Take screenshot of character edit page - should show character editing interface with all sections expanded
    await expect(page).toHaveScreenshot('character-edit.png', { fullPage: true });
  });

  test('World edit page should render consistently (dark mode)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('narraitor-color-scheme', 'dark');
    });
    await seedTestData(page);
    await page.goto('/worlds/world-cyberpunk-2077/edit');
    await expect(page).toHaveURL(/\/worlds\/world-cyberpunk-2077\/edit/);
    await waitForContentStable(page);
    const editor = page.locator('[data-testid="world-editor-root"]');
    await editor.waitFor({ timeout: 8000 });
    await page.waitForSelector('[data-testid="collapsible-section"]', { timeout: 8000 });
    await hideDynamicContent(page);
    await expandAllCollapsibleSections(page, editor);
    await pinAppShell(page);
    await expect(page).toHaveScreenshot('world-edit-dark.png', { fullPage: true });
  });

  test('World edit page should render consistently (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await seedTestData(page);
    await page.goto('/worlds/world-cyberpunk-2077/edit');
    await expect(page).toHaveURL(/\/worlds\/world-cyberpunk-2077\/edit/);
    await waitForContentStable(page);
    const editor = page.locator('[data-testid="world-editor-root"]');
    await editor.waitFor({ timeout: 8000 });
    await page.waitForSelector('[data-testid="collapsible-section"]', { timeout: 8000 });
    await hideDynamicContent(page);
    await expandAllCollapsibleSections(page, editor);
    await pinAppShell(page);
    await expect(page).toHaveScreenshot('world-edit-mobile.png', { fullPage: true });
  });

  test('Character edit page should render consistently (dark mode)', async ({ page }) => {
    test.setTimeout(45000);
    await page.addInitScript(() => {
      window.localStorage.setItem('narraitor-color-scheme', 'dark');
    });
    await seedTestData(page);
    await page.goto('/characters/char-cyberpunk-hacker/edit');
    await waitForContentStable(page);
    await page.waitForFunction(() => {
      return document.body.textContent && 
             !document.body.textContent.includes('Character not found') &&
             (document.body.textContent.includes('Edit Character') || document.body.textContent.includes('CharacterEditor'));
    }, { timeout: 10000 });
    await hideDynamicContent(page);
    await expandAllCollapsibleSections(page);
    await pinAppShell(page);
    await expect(page).toHaveScreenshot('character-edit-dark.png', { fullPage: true });
  });

  test('Character edit page should render consistently (mobile)', async ({ page }) => {
    test.setTimeout(45000);
    await page.setViewportSize({ width: 375, height: 812 });
    await seedTestData(page);
    await page.goto('/characters/char-cyberpunk-hacker/edit');
    await waitForContentStable(page);
    await page.waitForFunction(() => {
      return document.body.textContent && 
             !document.body.textContent.includes('Character not found') &&
             (document.body.textContent.includes('Edit Character') || document.body.textContent.includes('CharacterEditor'));
    }, { timeout: 10000 });
    await hideDynamicContent(page);
    await expandAllCollapsibleSections(page);
    await pinAppShell(page);
    await expect(page).toHaveScreenshot('character-edit-mobile.png', { fullPage: true });
  });
});
