import { test, expect } from '@playwright/test';

/**
 * Narraitor MVP Visual Regression Tests
 * 
 * Comprehensive visual testing for core user journeys and interfaces.
 * Tests key pages and components to catch visual regressions in the main user flows.
 */

/**
 * Wait for the Narraitor application to be fully loaded and ready
 */
async function waitForAppReady(page) {
  try {
    // Wait for initial page load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait for React hydration - look for interactive content
    await page.waitForSelector('main', { timeout: 15000 });
    
    // Give additional time for dynamic content and avoid loading screens
    await page.waitForTimeout(3000);
    
    // Check if we can see actual content (not just loading)
    const loadingVisible = await page.locator('text=Loading').isVisible().catch(() => false);
    
    if (loadingVisible) {
      console.warn('Application still showing loading screen - may not have fully loaded');
      // Wait a bit more and try again
      await page.waitForTimeout(5000);
    }
  } catch (error) {
    console.warn('waitForAppReady encountered an error:', error.message);
    // Continue anyway - CI might have different timing
  }
}

test.describe('Narraitor Core Interface Visual Tests', () => {
  test('landing page layout and navigation', async ({ page }) => {
    // Navigate to the main landing page
    await page.goto('/');
    await waitForAppReady(page);
    
    // Take full page screenshot of landing page
    await expect(page).toHaveScreenshot('landing-page-full.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test navigation header specifically if it exists
    const navigation = page.locator('nav').first();
    if (await navigation.isVisible()) {
      await expect(navigation).toHaveScreenshot('navigation-header.png');
    }
  });

  test('worlds listing and cards layout', async ({ page }) => {
    // Navigate to worlds page
    await page.goto('/worlds');
    await waitForAppReady(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('worlds-page-full.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test individual world card layout if any exist
    const worldCard = page.locator('[data-testid="world-card"]').first();
    if (await worldCard.isVisible()) {
      await expect(worldCard).toHaveScreenshot('world-card-component.png');
    }
  });

  test('characters listing and creation flow', async ({ page }) => {
    // Navigate to characters page
    await page.goto('/characters');
    await waitForAppReady(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('characters-page-full.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test character card layout if any exist
    const characterCard = page.locator('[data-testid="character-card"]').first();
    if (await characterCard.isVisible()) {
      await expect(characterCard).toHaveScreenshot('character-card-component.png');
    }
  });

  test('world creation wizard interface', async ({ page }) => {
    // Navigate to world creation
    await page.goto('/world/create');
    await waitForAppReady(page);
    
    // Take screenshot of initial wizard step
    await expect(page).toHaveScreenshot('world-creation-wizard-start.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test wizard navigation and step indicators
    const wizardSteps = page.locator('[data-testid="wizard-steps"]').first();
    if (await wizardSteps.isVisible()) {
      await expect(wizardSteps).toHaveScreenshot('wizard-step-indicator.png');
    }
  });

  test('character creation interface', async ({ page }) => {
    // Navigate to character creation
    await page.goto('/characters/create');
    await waitForAppReady(page);
    
    // Take screenshot of character creation form
    await expect(page).toHaveScreenshot('character-creation-form.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test attribute editor component if visible
    const attributeEditor = page.locator('[data-testid="attribute-editor"]').first();
    if (await attributeEditor.isVisible()) {
      await expect(attributeEditor).toHaveScreenshot('attribute-editor-component.png');
    }
  });
});