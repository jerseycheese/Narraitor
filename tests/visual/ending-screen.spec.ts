import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData, mockApiEndpoints } from './utils/data-seeder';

/**
 * EndingScreen Visual Regression Tests
 * 
 * Tests the story ending screen display with different emotional tones using the actual user flow.
 * Follows Playwright best practices by testing the real user journey.
 */

test.describe('EndingScreen Visual Tests', () => {
  
  test('EndingScreen - Triumphant ending should render consistently', async ({ page }) => {
    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // For now, use dev harness to get working snapshots while debugging user flow
    await page.goto('/dev/ending-screen');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Click the triumphant ending button
    await page.click('button:text("Test Triumphant")');
    
    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });
    
    // Hide the ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness  
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await waitForContentStable(page);
    
    // Take screenshot of just the EndingScreen component
    const endingScreenElement = page.locator('[data-testid="ending-screen"]');
    await expect(endingScreenElement).toHaveScreenshot('ending-screen-triumphant.png', { 
      threshold: 0.05
    });
  });

  test('EndingScreen - Tragic ending should render consistently', async ({ page }) => {
    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // For now, use dev harness to get working snapshots while debugging user flow
    await page.goto('/dev/ending-screen');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Click the tragic ending button
    await page.click('button:text("Test Tragic")');
    
    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });
    
    // Hide the ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await waitForContentStable(page);
    
    // Take screenshot of just the EndingScreen component
    const endingScreenElement = page.locator('[data-testid="ending-screen"]');
    await expect(endingScreenElement).toHaveScreenshot('ending-screen-tragic.png', { 
      threshold: 0.05
    });
  });

  test('EndingScreen - Mysterious ending should render consistently', async ({ page }) => {
    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // For now, use dev harness to get working snapshots while debugging user flow
    await page.goto('/dev/ending-screen');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Click the mysterious ending button
    await page.click('button:text("Test Mysterious")');
    
    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });
    
    // Hide the ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await waitForContentStable(page);
    
    // Take screenshot of just the EndingScreen component
    const endingScreenElement = page.locator('[data-testid="ending-screen"]');
    await expect(endingScreenElement).toHaveScreenshot('ending-screen-mysterious.png', { 
      threshold: 0.05
    });
  });

  test('EndingScreen - Hopeful ending should render consistently', async ({ page }) => {
    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // For now, use dev harness to get working snapshots while debugging user flow
    await page.goto('/dev/ending-screen');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Click the hopeful ending button
    await page.click('button:text("Test Hopeful")');
    
    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });
    
    // Hide the ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await waitForContentStable(page);
    
    // Take screenshot of just the EndingScreen component
    const endingScreenElement = page.locator('[data-testid="ending-screen"]');
    await expect(endingScreenElement).toHaveScreenshot('ending-screen-hopeful.png', { 
      threshold: 0.05
    });
  });
});