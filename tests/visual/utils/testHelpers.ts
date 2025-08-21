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
 * that may have dynamic loading states. Updated for 2025 best practices.
 * 
 * @param page - Playwright Page object  
 * @returns Promise that resolves when the app and dynamic content are ready
 */
export async function waitForGameSessionReady(page: Page): Promise<void> {
  // First do the standard app ready checks
  await waitForAppReady(page);
  
  try {
    // Ensure consistent viewport (2025 best practice for CI consistency)
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Give additional time for dynamic content and avoid loading screens
    await page.waitForTimeout(3000);
    
    // Wait for loading states to disappear (AI content generation can take time)
    console.log('Waiting for loading states to disappear...');
    
    // AI content generation can take longer in CI - use extended timeout for CI environments
    const aiTimeout = process.env.CI ? 90000 : 45000; // Increased timeouts based on 2025 practices
    
    // More robust loading state detection
    await page.waitForFunction(() => {
      // Check for loading spinners, text, and skeleton loaders
      const loadingIndicators = [
        ...document.querySelectorAll('[data-testid*="loading"]'),
        ...document.querySelectorAll('.loading'),
        ...document.querySelectorAll('[class*="spinner"]'),
        ...document.querySelectorAll('[class*="skeleton"]')
      ];
      
      // Check for loading text patterns
      const loadingTextPatterns = ['Loading', 'Thinking up some options', 'Generating', 'Please wait'];
      const allElements = document.querySelectorAll('*');
      
      for (let elem of allElements) {
        if (elem.textContent) {
          for (let pattern of loadingTextPatterns) {
            if (elem.textContent.includes(pattern)) {
              return false;
            }
          }
        }
      }
      
      // Check if loading indicators are visible
      for (let indicator of loadingIndicators) {
        const computedStyle = window.getComputedStyle(indicator);
        if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0') {
          return false;
        }
      }
      
      return true;
    }, { timeout: aiTimeout }).catch(() => {
      console.warn(`Loading indicators still visible after ${aiTimeout/1000}s timeout`);
    });
    
    // Wait for content to stabilize (prevent layout shifts)
    await page.waitForFunction(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(scrollHeight === document.documentElement.scrollHeight);
        }, 1000);
      });
    }, { timeout: 10000 }).catch(() => {
      console.warn('Content height did not stabilize within 10s');
    });
    
    // Final wait for animations and transitions to complete
    await page.waitForTimeout(2000);
    
    console.log('Game session appears to be fully loaded');
  } catch (error) {
    console.warn('waitForGameSessionReady encountered an error:', error instanceof Error ? error.message : 'Unknown error');
    // Continue anyway - CI might have different timing
  }
}