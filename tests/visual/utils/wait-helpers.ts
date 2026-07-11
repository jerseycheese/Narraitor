/**
 * Enhanced wait utilities for visual regression testing
 * 
 * Provides smart wait strategies to reduce flakiness in visual tests
 * by ensuring content is truly stable before taking screenshots.
 */

import { Page, Locator } from '@playwright/test';

const NEXT_DEV_OVERLAY_STYLE = `
  nextjs-portal,
  nextjs-toast,
  [data-nextjs-toast],
  [data-nextjs-dialog],
  [data-nextjs-dialog-overlay],
  [data-nextjs-build-indicator],
  [data-nextjs-error-overlay] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`;

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
    console.log(`Network idle wait failed: ${(error as Error).message}`);
  }
  
  // Wait for any loading indicators to disappear with reasonable timeouts
  const loadingSelectors = [
    '.loading',
    '[data-testid="loading"]',
    '[aria-label="Loading"]',
    '.spinner',
    'text=Creating archetypes...'
  ];
  
  for (const selector of loadingSelectors) {
    const locator = page.locator(selector);
    const count = await locator.count();
    if (count === 0) continue;
    try {
      await locator.first().waitFor({ state: 'detached', timeout: 5000 });
    } catch (error) {
      console.log(`Loading selector still present after 5s: ${selector} - ${(error as Error).message}`);
    }
  }
  
  // Wait for scoped loading indicators to disappear.
  // Avoid matching generic "Loading" copy on static docs pages.
  try {
    await page.waitForFunction(
      () => {
        const activeIndicators = document.querySelectorAll(
          '.loading, [data-testid="loading"], [aria-label="Loading"], .spinner'
        );
        return activeIndicators.length === 0;
      },
      { timeout: 4000 }
    );
  } catch (error) {
    console.log(`Scoped loading indicator wait failed: ${(error as Error).message}`);
  }
  
  // Final stabilization wait - enough time for data seeding to complete
  await page.waitForTimeout(500);
}

export async function waitForNavigationHeading(
  page: Page,
  expectedHeading: string,
  { timeout = 5000, exact = false }: { timeout?: number; exact?: boolean } = {}
): Promise<void> {
  await page.waitForFunction(
    ({ headingText, exact }) => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
      return headings.some((heading) => {
        const text = heading.textContent?.trim() ?? '';
        return exact ? text === headingText : text.includes(headingText);
      });
    },
    { headingText: expectedHeading, exact },
    { timeout }
  );
}

/**
 * Wait until all images on the page have finished loading.
 */
export async function waitForImagesLoaded(page: Page, timeout: number = 5000): Promise<void> {
  try {
    // waitForFunction signature is (fn, arg, options) — the timeout must go in
    // the third slot, or it's serialized as the (unused) page-function arg and
    // the call silently falls back to the default action timeout.
    await page.waitForFunction(
      () => Array.from(document.images).every((img) => img.complete),
      undefined,
      { timeout }
    );
  } catch (error) {
    console.log(`Image loading wait failed: ${(error as Error).message}`);
  }
}

/**
 * Wait until the images inside a container have finished loading.
 *
 * Scoped to a selector so an offscreen lazy image elsewhere on the page can't
 * poison the wait (a global document.images check stays false forever and times
 * out). Lazy (IntersectionObserver) images inside the container are forced to
 * `eager` first, so a full-element screenshot doesn't capture them mid-load —
 * those images otherwise only fetch when scrolled into view, after this wait.
 *
 * Use for locator screenshots of image-bearing surfaces (e.g. the worlds-list
 * banners), where the global waitForImagesLoaded is unreliable on CI.
 */
export async function waitForImagesLoadedIn(
  page: Page,
  selector: string,
  timeout: number = 30000
): Promise<void> {
  try {
    await page.evaluate((sel) => {
      const root = document.querySelector(sel);
      root?.querySelectorAll('img').forEach((img) => {
        if (img.loading === 'lazy') img.loading = 'eager';
      });
    }, selector);
    // Require naturalWidth > 0, not just `complete`: a next/image banner served
    // through on-demand optimization can be slow to first-paint on CI, and
    // `complete` flips true for the empty box before the pixels arrive.
    await page.waitForFunction(
      (sel) => {
        const root = document.querySelector(sel);
        if (!root) return false;
        return Array.from(root.querySelectorAll('img')).every(
          (img) => img.complete && img.naturalWidth > 0
        );
      },
      selector,
      { timeout }
    );
  } catch (error) {
    console.log(`Scoped image wait failed for ${selector}: ${(error as Error).message}`);
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

      /* Hide Next.js dev overlay controls from screenshots */
      ${NEXT_DEV_OVERLAY_STYLE}

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
 * Hide only the Next.js dev overlay while preserving app-level tutorial UI.
 */
export async function hideNextDevOverlay(page: Page): Promise<void> {
  await page.addStyleTag({
    content: NEXT_DEV_OVERLAY_STYLE
  });
}

/**
 * Pin the sticky app shell (workshop sidebar + page header) into normal flow.
 * Without this, locator and fullPage screenshots of tall pages get the sticky
 * header overlaid mid-content, since the header sticks at its viewport position
 * relative to where the locator was scrolled. Mirrors the shell-pinning step in
 * world-creation.spec.ts captureWizardStep.
 *
 * At mobile width the workshop sidebar is a fixed off-canvas drawer rather than
 * the sticky side column it is on desktop. Pinning that drawer into flow drops a
 * full-viewport-tall blank block above the page content, so hide it for the
 * capture — a closed drawer isn't part of the visible mobile layout. Desktop
 * keeps the column pinned so a tall page's header doesn't overlay mid-content.
 */
export async function pinAppShell(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const sidebar = document.querySelector('.workshop-sidebar') as HTMLElement | null;
    if (sidebar && getComputedStyle(sidebar).position === 'fixed') {
      sidebar.style.setProperty('display', 'none', 'important');
    }
  });
  await page.addStyleTag({
    content: `
      .workshop-sidebar {
        position: static !important;
        height: auto !important;
        min-height: 100vh !important;
        max-height: none !important;
        overflow: visible !important;
      }
      header {
        position: static !important;
      }
    `,
  });
  await page.waitForTimeout(50);
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
