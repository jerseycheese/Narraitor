/**
 * Enhanced wait utilities for visual regression testing
 * 
 * Provides smart wait strategies to reduce flakiness in visual tests
 * by ensuring content is truly stable before taking screenshots.
 */

import { Page, Locator } from '@playwright/test';

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
 * Wait until all images on the page have finished loading.
 */
export async function waitForImagesLoaded(page: Page, timeout: number = 5000): Promise<void> {
  try {
    await page.waitForFunction(
      () => Array.from(document.images).every((img) => img.complete),
      { timeout }
    );
  } catch {
    console.log('Image not loaded yet, proceeding with screenshot');
  }
}

/**
 * Wait for the document height to remain stable for a short period.
 */
export async function waitForStableScrollHeight(
  page: Page,
  { timeout = 5000, stableDuration = 500 }: { timeout?: number; stableDuration?: number } = {}
): Promise<void> {
  const start = Date.now();
  const maxWaitMs = timeout + stableDuration;
  await page.waitForFunction(
    ({ stableDuration, start, maxWaitMs }) => {
      const now = Date.now();
      const doc = document.documentElement;
      const height = doc.scrollHeight;
      const prevHeight = (window as any).__lastScrollHeight;
      const prevTime = (window as any).__lastScrollHeightTime;

      if (prevHeight !== height) {
        (window as any).__lastScrollHeight = height;
        (window as any).__lastScrollHeightTime = now;
        return false;
      }

      if (!prevTime) {
        (window as any).__lastScrollHeightTime = now;
        return false;
      }

      const isStable = now - prevTime >= stableDuration;
      const exceeded = now - start >= maxWaitMs;

      return isStable || exceeded;
    },
    { stableDuration, start, maxWaitMs },
    { timeout }
  );
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

      /* Hide Joyride tutorial overlay */
      #react-joyride-portal,
      .react-joyride__overlay,
      .react-joyride__spotlight,
      .react-joyride__tooltip,
      [data-test-id="overlay"],
      .react-joyride__beacon {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      /* Hide DevTools during visual tests to avoid duplicate UI and noise */
      [data-testid="devtools-panel-container"],
      [data-testid="devtools-panel-header"],
      [data-testid="devtools-panel-content"],
      [data-testid="devtools-panel-toggle"],
      .devtools-panel,
      .devtools-toggle,
      .devtools-button {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
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
 * Expand all CollapsibleSection components on the page for consistent visual testing.
 * This ensures all collapsible content is visible in screenshots.
 */
export async function expandAllCollapsibleSections(page: Page, container?: Locator): Promise<void> {
  try {
    const scope = container ?? page;
    // Up to 5 passes in case sections render lazily/nested
    for (let pass = 0; pass < 5; pass++) {
      const collapsed = scope
        .locator('[data-testid="collapsible-section-toggle"]').filter({ hasText: '+' });
      const remaining = await collapsed.count();
      if (remaining === 0) break;
      for (let i = 0; i < remaining; i++) {
        try {
          await collapsed.nth(i).click({ timeout: 1000 });
        } catch {
          // Ignore and continue expanding remaining
        }
      }
      // Allow DOM to settle between passes
      await page.waitForTimeout(150);
    }
  } catch {
    // Don't fail the test if expansion fails - continue with screenshot
  }

  try {
    const root = container ?? page.locator('body');
    await root.evaluate((element) => {
      const sections = element.querySelectorAll('[data-testid="collapsible-section"]');
      sections.forEach((section) => {
        const toggle = section.querySelector('[data-testid="collapsible-section-toggle"]') as HTMLElement | null;
        const header = section.querySelector('[data-testid="collapsible-section-header"]') as HTMLElement | null;
        const content = section.querySelector('[data-testid="collapsible-section-content"]') as HTMLElement | null;

        if (toggle) {
          toggle.setAttribute('aria-expanded', 'true');
          toggle.textContent = '-';
        }

        if (header) {
          header.setAttribute('aria-expanded', 'true');
        }

        if (content) {
          content.classList.add('block');
          content.classList.remove('hidden');
          content.setAttribute('aria-hidden', 'false');
          content.style.display = 'block';
          content.style.maxHeight = 'none';
        }
      });
    });
  } catch {
    // Ignore forced expansion failures
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
