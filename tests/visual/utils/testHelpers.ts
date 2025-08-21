import { Page } from '@playwright/test';

/**
 * Shared utilities for visual regression tests
 * 
 * Provides common functionality for Playwright visual tests including
 * page readiness checks and consistent waiting strategies.
 */

/**
 * Wait for the Narraitor application to be fully loaded and ready
 * 
 * This function ensures consistent visual screenshots by waiting for:
 * - Network requests to complete
 * - React hydration to finish
 * - Fonts to load and stabilize
 * - Dynamic content to render
 * 
 * @param page - Playwright Page object
 * @returns Promise that resolves when the app is ready for screenshots
 */
export async function waitForAppReady(page: Page): Promise<void> {
  try {
    // Wait for initial page load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait for React hydration - look for interactive content
    await page.waitForSelector('main', { timeout: 15000 });
    
    // Wait for fonts to load - critical for consistent screenshots
    await page.waitForFunction(() => {
      return document.fonts.ready;
    }, { timeout: 10000 }).catch(() => {
      console.warn('Font loading timeout - continuing anyway');
    });
    
    // Additional wait for font rendering to stabilize
    await page.waitForTimeout(2000);
  } catch (error) {
    console.warn('waitForAppReady encountered an error:', error instanceof Error ? error.message : 'Unknown error');
    // Continue anyway - CI might have different timing
  }
}

/**
 * Extended wait for app ready that includes additional checks for game session content
 * 
 * This version includes extra waits and checks specifically for game session interfaces
 * that may have dynamic loading states.
 * 
 * @param page - Playwright Page object  
 * @returns Promise that resolves when the app and dynamic content are ready
 */
export async function waitForGameSessionReady(page: Page): Promise<void> {
  // First do the standard app ready checks
  await waitForAppReady(page);
  
  try {
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
    console.warn('waitForGameSessionReady encountered an error:', error instanceof Error ? error.message : 'Unknown error');
    // Continue anyway - CI might have different timing
  }
}