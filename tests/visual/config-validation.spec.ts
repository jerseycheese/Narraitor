import { test, expect } from '@playwright/test';

/**
 * Playwright Configuration Validation Tests
 * 
 * Minimal test suite that validates Playwright is properly configured
 * without requiring the full application to be running.
 */

test.describe('Playwright Configuration Validation', () => {
  test('playwright configuration is working', async ({ page, browserName }) => {
    // Simple test that validates Playwright can load pages and take screenshots
    // This works even without the dev server running
    
    // Navigate to a simple HTML page to test screenshot capability
    await page.setContent(`
      <html>
        <head><title>Playwright Test</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Playwright Visual Regression Test</h1>
          <p>Browser: ${browserName}</p>
          <p>Viewport: ${page.viewportSize()?.width}x${page.viewportSize()?.height}</p>
          <div style="background: #f0f0f0; padding: 10px; margin: 10px 0;">
            Configuration validation successful
          </div>
        </body>
      </html>
    `);
    
    // Take a screenshot to validate visual testing capability
    await expect(page).toHaveScreenshot('config-validation.png', {
      animations: 'disabled',
      threshold: 0.2
    });
  });

  test('viewport configuration is correct', async ({ page }) => {
    // Validate that viewport is set correctly
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(viewport?.width).toBe(1280);
    expect(viewport?.height).toBe(720);
  });

  test('screenshot infrastructure works', async ({ page }) => {
    // Test basic screenshot functionality
    await page.setContent('<h1>Screenshot Test</h1>');
    
    const element = page.locator('h1');
    await expect(element).toHaveScreenshot('element-test.png');
  });
});