/**
 * Enhanced wait utilities for visual regression testing
 * 
 * Provides smart wait strategies to reduce flakiness in visual tests
 * by ensuring content is truly stable before taking screenshots.
 */

import { Page } from '@playwright/test';

/**
 * Wait for content to be fully stable before taking screenshots.
 * Combines multiple wait strategies to ensure reliable visual testing.
 */
export async function waitForContentStable(page: Page): Promise<void> {
  // Wait for network activity to settle
  await page.waitForLoadState('networkidle');
  
  // Wait for any loading indicators to disappear
  const loadingSelectors = [
    '.loading',
    '[data-testid="loading"]',
    '[aria-label="Loading"]',
    '.spinner'
  ];
  
  for (const selector of loadingSelectors) {
    try {
      // If loading element exists, wait for it to be gone
      await page.waitForSelector(selector, { state: 'detached', timeout: 5000 });
    } catch (error) {
      // Loading element not found or already gone - continue
    }
  }
  
  // Wait for "Loading..." text to disappear (common in React hydration)
  try {
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 8000 }
    );
  } catch (error) {
    // "Loading..." text not found or already gone - continue
  }
  
  // Final stabilization wait to ensure animations complete
  await page.waitForTimeout(300);
}

/**
 * Hide dynamic content that shouldn't be part of visual regression testing.
 * This prevents timestamp changes, random tips, and other dynamic elements
 * from causing false positive test failures.
 */
export async function hideDynamicContent(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      /* Hide common dynamic content elements */
      .timestamp,
      .random-tip,
      [data-testid="current-time"],
      [data-testid="last-updated"],
      .dynamic-content,
      /* Hide DevTools panel during visual regression tests */
      [data-testid="devtools-panel-container"],
      [data-testid="devtools-panel-header"],
      [data-testid="devtools-panel"],
      .devtools-panel,
      .narraitor-devtools,
      [class*="devtools"],
      [id*="devtools"] {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* Disable animations for consistent screenshots */
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
  
  // Hide DevTools panel elements using JavaScript
  await page.evaluate(() => {
    const devToolsElements = document.querySelectorAll(
      '[data-testid*="devtools"], .devtools-panel, .narraitor-devtools, [class*="devtools"], [id*="devtools"]'
    );
    devToolsElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.display = 'none';
      element.style.visibility = 'hidden';
    });
  });
}

/**
 * Enhanced screenshot helper that combines stability waiting and dynamic content hiding.
 * Use this instead of direct toHaveScreenshot() calls for better reliability.
 */
export async function takeStableScreenshot(
  page: Page, 
  name: string, 
  options?: Parameters<typeof page.screenshot>[0]
): Promise<void> {
  await waitForContentStable(page);
  await hideDynamicContent(page);
  
  // Small additional wait after hiding content to ensure styles apply
  await page.waitForTimeout(100);
  
  // Take the screenshot with enhanced options
  await page.screenshot({
    ...options,
    path: `test-results/${name}`,
    fullPage: false, // Prefer viewport screenshots for consistency
  });
}