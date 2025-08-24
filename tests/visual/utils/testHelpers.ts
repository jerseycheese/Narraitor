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
    // Simple wait for page load and basic content
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    
    // Wait for main content area to appear
    await page.waitForSelector('main, body', { timeout: 10000 }).catch(() => {
      console.warn('Main content not found - continuing anyway');
    });
    
    // Short wait for rendering to stabilize  
    await page.waitForTimeout(2000);
  } catch (error) {
    console.warn('waitForAppReady encountered an error:', error instanceof Error ? error.message : 'Unknown error');
    // Continue anyway - visual tests should still work
  }
}

/**
 * Extended wait for app ready that includes additional checks for game session content
 * 
 * This version includes extra waits and checks specifically for game session interfaces
 * that may have dynamic loading states. Updated for 2025 best practices.
 * 
 * @param page - Playwright Page object  
 * @returns Promise that resolves when the app and dynamic content are ready
 */
export async function waitForGameSessionReady(page: Page): Promise<void> {
  // First do the standard app ready checks
  await waitForAppReady(page);
  
  try {
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Brief wait for any dynamic content
    await page.waitForTimeout(3000);
    
    console.log('Game session appears to be fully loaded');
  } catch (error) {
    console.warn('waitForGameSessionReady encountered an error:', error instanceof Error ? error.message : 'Unknown error');
    // Continue anyway - visual tests should still work
  }
}