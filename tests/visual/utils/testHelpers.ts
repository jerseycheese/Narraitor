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
    
    // Wait for React hydration - specifically wait for loading state to disappear
    await page.waitForFunction(() => {
      // Check if still showing loading state
      const body = document.body;
      if (!body) return false;
      
      // Look for loading text that indicates app hasn't hydrated yet
      const text = body.textContent || '';
      if (text.includes('Loading...')) {
        return false;
      }
      
      // Check if we have meaningful content (more than just "Skip to main content")
      const meaningfulElements = document.querySelectorAll('h1, h2, p, button, nav, main, form, input');
      return meaningfulElements.length > 0;
    }, { timeout: 30000 }).catch(() => {
      console.warn('App did not fully hydrate within 30s - continuing anyway');
    });
    
    // Wait for specific interactive elements that indicate the app has loaded
    try {
      await page.waitForSelector('main', { timeout: 5000 });
    } catch {
      // If no main, wait for any navigation or interactive content
      try {
        await page.waitForSelector('nav, header, [role="navigation"], h1, h2', { timeout: 5000 });
      } catch {
        console.warn('No main navigation or heading elements found - continuing anyway');
      }
    }
    
    // Wait for fonts to load - critical for consistent screenshots
    await page.waitForFunction(() => {
      return document.fonts.ready;
    }, { timeout: 10000 }).catch(() => {
      console.warn('Font loading timeout - continuing anyway');
    });
    
    // Additional wait for rendering to stabilize
    await page.waitForTimeout(3000);
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
      const loadingTextPatterns = ['Loading', 'Generating', 'Please wait'];
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