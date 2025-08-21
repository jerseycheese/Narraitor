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
    
    // Wait for loading states to disappear (AI content generation can take time)
    console.log('Waiting for loading states to disappear...');
    
    // Wait for "Loading..." text to disappear (up to 30 seconds for AI generation)
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('*');
      for (let elem of loadingElements) {
        if (elem.textContent && elem.textContent.includes('Loading')) {
          return false;
        }
      }
      return true;
    }, { timeout: 30000 }).catch(() => {
      console.warn('Loading text still visible after 30s timeout');
    });
    
    // Wait for "Thinking up some options..." to disappear
    await page.waitForFunction(() => {
      const thinkingElements = document.querySelectorAll('*');
      for (let elem of thinkingElements) {
        if (elem.textContent && elem.textContent.includes('Thinking up some options')) {
          return false;
        }
      }
      return true;
    }, { timeout: 30000 }).catch(() => {
      console.warn('AI choice generation still in progress after 30s timeout');
    });
    
    // Additional wait for final content stabilization
    await page.waitForTimeout(2000);
    
    console.log('Game session appears to be fully loaded');
  } catch (error) {
    console.warn('waitForGameSessionReady encountered an error:', error instanceof Error ? error.message : 'Unknown error');
    // Continue anyway - CI might have different timing
  }
}