import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, expandAllCollapsibleSections } from './utils/wait-helpers';
import { seedTestData, seedBaseData } from './utils/seedTestData';

/**
 * Main Pages Visual Regression Tests
 * 
 * Tests core application pages for visual consistency.
 * Covers both empty states (first-time users) and populated states (returning users).
 */

test.describe('Main Pages Visual Tests', () => {
  test('Home page should render consistently (empty state)', async ({ page }) => {
    // Use base seeding for empty state - much faster than clearing everything manually
    await seedBaseData(page);
    
    await page.goto('/');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Verify page loaded with expected content
    await expect(page).toHaveTitle(/Narraitor/i);
    
    // Take full page screenshot - empty QuickPlay form
    await expect(page).toHaveScreenshot('home-empty-state.png', { fullPage: true });
  });

  test('Home page should render consistently', async ({ page }) => {
    // Seed test data to show returning user with recent game session
    await seedTestData(page);
    await page.goto('/');
    await waitForContentStable(page);
    // Ensure the Continue section appears (seeded session present)
    await page.waitForSelector('[aria-labelledby="continue-game-heading"]', { timeout: 8000 });
    await hideDynamicContent(page);
    
    // Verify page loaded with expected content
    await expect(page).toHaveTitle(/Narraitor/i);
    
    // Take full page screenshot - should show "Continue Last Game" with character and world info
    await expect(page).toHaveScreenshot('home-page.png', { fullPage: true });
  });

  test('Settings page should render consistently', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for this test to handle resource contention
    
    await seedTestData(page);
    
    await page.goto('/settings');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of settings page
    await expect(page).toHaveScreenshot('settings.png', { fullPage: true });
  });

  test('Worlds list page should render consistently (empty state)', async ({ page }) => {
    // Use base seeding for empty state - much faster and more reliable
    await seedBaseData(page);
    
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of worlds page - shows empty state with onboarding
    await expect(page).toHaveScreenshot('worlds-list-empty-state.png', { fullPage: true });
  });

  test('Worlds list page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to worlds page to see populated data
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of worlds page - should show populated worlds
    await expect(page).toHaveScreenshot('worlds-list.png', { fullPage: true });
  });

  test('Characters list page should render consistently', async ({ page }) => {
    await seedTestData(page);
    await page.goto('/characters');
    await waitForContentStable(page);

    // Wait for the world hero to appear (indicates stores have hydrated)
    await page.waitForSelector('h2:has-text("Characters")', { timeout: 10000 });

    await hideDynamicContent(page);

    // Take screenshot of characters page - should show populated characters
    await expect(page).toHaveScreenshot('characters-list.png', { fullPage: true });
  });

  test('World detail page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to the cyberpunk world detail page
    await page.goto('/worlds/world-cyberpunk-2077');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of world detail page - should show world info, characters, and actions
    await expect(page).toHaveScreenshot('world-detail.png', { fullPage: true });
  });

  test('Character detail page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to Nova character detail page
    await page.goto('/characters/char-cyberpunk-hacker');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of character detail page - should show character sheet, attributes, skills
    await expect(page).toHaveScreenshot('character-detail.png', { fullPage: true });
  });

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
    
    // Take screenshot of character edit page - should show character editing interface with all sections expanded
    await expect(page).toHaveScreenshot('character-edit.png', { fullPage: true });
  });
});
