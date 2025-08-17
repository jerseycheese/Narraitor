import { test, expect } from '@playwright/test';

/**
 * Basic Visual Snapshot Tests
 * 
 * Simple, reliable snapshot comparison tests that validate
 * Playwright visual regression testing capability.
 */

test.describe('Basic Visual Snapshots', () => {
  test('basic page snapshot', async ({ page }) => {
    // Create a simple, consistent page for snapshot testing
    await page.setContent(`
      <html>
        <head>
          <title>Basic Snapshot Test</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
            }
            h1 { 
              color: #333; 
              border-bottom: 2px solid #007acc;
              padding-bottom: 10px;
            }
            .status {
              background: #f0f8ff;
              border: 1px solid #007acc;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Playwright Visual Testing</h1>
            <div class="status">
              ✓ Visual regression testing is working
            </div>
            <p>This is a basic snapshot test to validate the Playwright visual testing infrastructure.</p>
          </div>
        </body>
      </html>
    `);

    // Take full page snapshot
    await expect(page).toHaveScreenshot('basic-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('simple element snapshot', async ({ page }) => {
    await page.setContent(`
      <div style="
        width: 200px; 
        height: 100px; 
        background: linear-gradient(45deg, #007acc, #0099ff);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: Arial, sans-serif;
        border-radius: 8px;
      ">
        Test Element
      </div>
    `);

    // Take element snapshot
    const element = page.locator('div').first();
    await expect(element).toHaveScreenshot('test-element.png');
  });
});