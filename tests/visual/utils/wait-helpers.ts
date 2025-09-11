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
      .dynamic-content {
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
 * Expand all CollapsibleSection components on the page for consistent visual testing.
 * This ensures all collapsible content is visible in screenshots.
 */
export async function expandAllCollapsibleSections(page: Page): Promise<void> {
  // Find all collapsible section toggle buttons that are collapsed (showing '+')
  const collapsedSections = page.locator('[data-testid="collapsible-section-toggle"]').filter({
    hasText: '+'
  });
  
  const count = await collapsedSections.count();
  console.log(`Found ${count} collapsed sections to expand`);
  
  // Click each collapsed section to expand it
  for (let i = 0; i < count; i++) {
    try {
      await collapsedSections.nth(i).click();
      // Small wait between clicks to ensure proper expansion
      await page.waitForTimeout(100);
    } catch (error) {
      console.log(`Failed to expand section ${i}:`, error);
      // Continue with other sections even if one fails
    }
  }
  
  // Final wait to ensure all expansions are complete
  await page.waitForTimeout(300);
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