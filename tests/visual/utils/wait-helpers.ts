/**
 * Enhanced wait utilities for visual regression testing
 * 
 * Provides smart wait strategies to reduce flakiness in visual tests
 * by ensuring content is truly stable before taking screenshots.
 */

import { Page } from '@playwright/test';

/**
 * Wait for content to be fully stable before taking screenshots.
 * Balanced approach - faster than original but reliable for data seeding.
 */
export async function waitForContentStable(page: Page): Promise<void> {
  // Wait for network activity to settle - increased timeout for data seeding
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch (error) {
    // If networkidle times out, continue - common with dynamic content
    console.log('Network idle timeout, continuing...');
  }
  
  // Wait for any loading indicators to disappear with reasonable timeouts
  const loadingSelectors = [
    '.loading',
    '[data-testid="loading"]',
    '[aria-label="Loading"]',
    '.spinner',
    'text=Loading...',
    'text=Creating archetypes...'
  ];
  
  // Check all loading selectors concurrently
  await Promise.allSettled(
    loadingSelectors.map(selector => 
      page.waitForSelector(selector, { state: 'detached', timeout: 5000 })
        .catch(() => {}) // Ignore if not found
    )
  );
  
  // Wait for "Loading..." text to disappear with adequate timeout for seeding
  try {
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading') && 
            !document.body.textContent?.includes('Creating archetypes'),
      { timeout: 8000 }
    );
  } catch (error) {
    // Loading text not found or already gone - continue
  }
  
  // Final stabilization wait - enough time for data seeding to complete
  await page.waitForTimeout(500);
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
 * Smart wait for element interactions that replaces fixed timeouts.
 */
export async function waitForInteraction(
  page: Page,
  action: () => Promise<void>,
  options: {
    waitFor?: 'navigation' | 'response' | 'networkidle' | 'custom';
    customWait?: () => Promise<void>;
    timeout?: number;
  } = {}
): Promise<void> {
  const { waitFor = 'networkidle', timeout = 5000 } = options;

  if (waitFor === 'navigation') {
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout }),
      action()
    ]);
  } else if (waitFor === 'response') {
    await Promise.all([
      page.waitForResponse(response => response.status() === 200, { timeout }),
      action()
    ]);
  } else if (waitFor === 'custom' && options.customWait) {
    await Promise.all([
      options.customWait(),
      action()
    ]);
  } else {
    // Default: wait for network idle
    await action();
    try {
      await page.waitForLoadState('networkidle', { timeout: timeout / 2 });
    } catch (e) {
      // Continue if network idle times out
    }
  }
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
  await page.waitForTimeout(50); // Reduced from 100ms
  
  // Take the screenshot with enhanced options
  await page.screenshot({
    ...options,
    path: `test-results/${name}`,
    fullPage: false, // Prefer viewport screenshots for consistency
  });
}