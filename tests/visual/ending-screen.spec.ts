import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';

/**
 * EndingScreen Visual Regression Tests
 * 
 * Tests the story ending screen display with different emotional tones using the dev harness.
 * This approach ensures the EndingScreen component actually renders by using controlled test data.
 */

test.describe('EndingScreen Visual Tests', () => {
  
  test('EndingScreen - Triumphant ending should render consistently', async ({ page }) => {
    // Set up static ending image to prevent dynamic generation
    await page.addInitScript(() => {
      // Set a mock static image URL for visual consistency
      localStorage.setItem('test-ending-image', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjU5ZTBiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzQ0NDAzYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVuZGluZyBJbWFnZTwvdGV4dD48L3N2Zz4=');
    });
    
    // Navigate to dev harness for controlled EndingScreen testing
    await page.goto('/dev/ending-screen');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Click the "Test Triumphant" button to load triumphant ending
    await page.click('button:text("Test Triumphant")');
    
    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 5000 });
    
    // Hide the entire ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      // Also hide any individual images
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness  
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await waitForContentStable(page);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('ending-screen-triumphant.png', { 
      fullPage: true,
      threshold: 0.05  // 5% threshold for minor rendering differences
    });
  });

  test('EndingScreen - Tragic ending should render consistently', async ({ page }) => {
    // Set up static ending image to prevent dynamic generation
    await page.addInitScript(() => {
      // Set a mock static image URL for visual consistency
      localStorage.setItem('test-ending-image', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGM0YzNkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZlZmVmZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVuZGluZyBJbWFnZTwvdGV4dD48L3N2Zz4=');
    });
    
    // Navigate to dev harness for controlled EndingScreen testing
    await page.goto('/dev/ending-screen');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Click the "Test Tragic" button to load tragic ending
    await page.click('button:text("Test Tragic")');
    
    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 5000 });
    
    // Hide the entire ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      // Also hide any individual images
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await waitForContentStable(page);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('ending-screen-tragic.png', { 
      fullPage: true,
      threshold: 0.05
    });
  });

  test('EndingScreen - Mysterious ending should render consistently', async ({ page }) => {
    // Set up static ending image to prevent dynamic generation
    await page.addInitScript(() => {
      // Set a mock static image URL for visual consistency
      localStorage.setItem('test-ending-image', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzc0MTUxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZlZmVmZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVuZGluZyBJbWFnZTwvdGV4dD48L3N2Zz4=');
    });
    
    // Navigate to dev harness for controlled EndingScreen testing
    await page.goto('/dev/ending-screen');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Click the "Test Mysterious" button to load mysterious ending
    await page.click('button:text("Test Mysterious")');
    
    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 5000 });
    
    // Hide the entire ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      // Also hide any individual images
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await waitForContentStable(page);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('ending-screen-mysterious.png', { 
      fullPage: true,
      threshold: 0.05
    });
  });

  test('EndingScreen - Hopeful ending should render consistently', async ({ page }) => {
    // Set up static ending image to prevent dynamic generation
    await page.addInitScript(() => {
      // Set a mock static image URL for visual consistency
      localStorage.setItem('test-ending-image', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTU4MDNkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZlZmVmZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVuZGluZyBJbWFnZTwvdGV4dD48L3N2Zz4=');
    });
    
    // Navigate to dev harness for controlled EndingScreen testing
    await page.goto('/dev/ending-screen');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Click the "Test Hopeful" button to load hopeful ending
    await page.click('button:text("Test Hopeful")');
    
    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 5000 });
    
    // Hide the entire ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      // Also hide any individual images
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await waitForContentStable(page);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('ending-screen-hopeful.png', { 
      fullPage: true,
      threshold: 0.05
    });
  });
});