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
  try {
    // Wait for any dynamic content to load first
    await page.waitForTimeout(500);
    
    // Find all collapsible sections (not just buttons) to get a complete count
    const allSections = page.locator('[data-testid="collapsible-section"]');
    const totalCount = await allSections.count();
    console.log(`Found ${totalCount} total CollapsibleSections on page`);
    
    // Multiple approaches to find collapsed sections
    const approaches = [
      // Approach 1: Find buttons with '+' text
      page.locator('[data-testid="collapsible-section-toggle"]').filter({ hasText: '+' }),
      // Approach 2: Find buttons with aria-expanded="false"
      page.locator('[data-testid="collapsible-section-toggle"][aria-expanded="false"]'),
      // Approach 3: Find section headers where content is hidden
      page.locator('[data-testid="collapsible-section-header"][aria-expanded="false"]')
    ];
    
    let expandedCount = 0;
    
    for (const [index, approach] of approaches.entries()) {
      try {
        const collapsedSections = approach;
        const count = await collapsedSections.count();
        console.log(`Approach ${index + 1}: Found ${count} collapsed sections`);
        
        if (count === 0) continue;
        
        // Click each collapsed section individually with verification
        for (let i = 0; i < count; i++) {
          try {
            const section = collapsedSections.nth(i);
            
            // Verify the section is still collapsed before clicking
            const isStillCollapsed = await section.getAttribute('aria-expanded') !== 'true' ||
                                     await section.textContent() === '+';
            
            if (isStillCollapsed) {
              await section.click({ timeout: 3000 });
              expandedCount++;
              
              // Wait for the expansion animation to complete
              await page.waitForTimeout(150);
              
              console.log(`Successfully expanded section ${i + 1} using approach ${index + 1}`);
            }
          } catch (error) {
            console.log(`Failed to expand section ${i} with approach ${index + 1}:`, error);
            // Continue with next section
          }
        }
        
        // If we successfully expanded sections with this approach, we can stop
        if (count > 0 && expandedCount > 0) {
          break;
        }
      } catch (error) {
        console.log(`Approach ${index + 1} failed:`, error);
        // Try next approach
      }
    }
    
    // Final verification - check how many sections are still collapsed
    await page.waitForTimeout(300);
    const remainingCollapsed = await page.locator('[data-testid="collapsible-section-toggle"]').filter({
      hasText: '+'
    }).count();
    
    console.log(`Expansion complete: expanded ${expandedCount} sections, ${remainingCollapsed} remain collapsed`);
    
    if (remainingCollapsed > 0) {
      console.log('WARNING: Some sections remain collapsed after expansion attempts');
    }
    
  } catch (error) {
    console.log('Failed to expand collapsible sections:', error);
    // Don't fail the test if we can't expand sections - continue with screenshot
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