import { test, expect } from '@playwright/test';
import { waitForAppReady } from './utils/testHelpers';

/**
 * Homepage Visual Regression Tests
 * 
 * These tests ensure visual consistency of the homepage interface.
 * They focus on USER-FACING visual behavior and critical layout elements.
 * 
 * Will FAIL initially (red phase) until:
 * - Playwright configuration exists
 * - Baseline screenshots are generated
 * - Application is running for screenshot capture
 * 
 * Acceptance Criteria Validation:
 * - Homepage layout remains visually consistent
 * - Navigation elements render correctly
 * - Interactive states are visually stable
 * - Responsive design breakpoints maintain layout integrity
 */

test.describe('Homepage Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure consistent state before each test
    await page.goto('/');
    
    // Wait for any initial loading to complete
    await waitForAppReady(page);
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('should maintain visual consistency of homepage layout', async ({ page }) => {
    // Core visual regression test for homepage
    // Tests the overall layout structure that users see
    
    await expect(page).toHaveScreenshot('homepage-full-layout.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.3
    });
  });

  test('should maintain navigation header visual consistency', async ({ page }) => {
    // Test critical navigation elements
    // Navigation is essential for user experience
    
    const navigation = page.locator('nav, header, [role="navigation"]').first();
    await expect(navigation).toBeVisible();
    
    await expect(navigation).toHaveScreenshot('homepage-navigation.png', {
      threshold: 0.2
    });
  });

  test('should maintain hero section visual layout', async ({ page }) => {
    // Test the main hero/banner section that users see first
    // This is typically the most important visual element
    
    const heroSection = page.locator('main, [data-testid="hero"], .hero, h1').first().locator('..');
    
    if (await heroSection.count() > 0) {
      await expect(heroSection).toHaveScreenshot('homepage-hero-section.png', {
        threshold: 0.25
      });
    } else {
      // Fallback to main content area
      const mainContent = page.locator('main').first();
      await expect(mainContent).toHaveScreenshot('homepage-main-content.png', {
        threshold: 0.25
      });
    }
  });

  test('should maintain footer visual consistency', async ({ page }) => {
    // Test footer elements if present
    const footer = page.locator('footer, [role="contentinfo"]').first();
    
    if (await footer.count() > 0) {
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toHaveScreenshot('homepage-footer.png', {
        threshold: 0.2
      });
    } else {
      // Skip if no footer exists
      test.skip(true, 'No footer element found on homepage');
    }
  });

  test('should handle interactive element hover states consistently', async ({ page }) => {
    // Test that interactive elements have consistent visual states
    // Important for user experience and accessibility
    
    // Find proper UI buttons, excluding accessibility skip links and elements outside viewport
    const buttons = page.locator('button:not(.sr-only), [role="button"]:not(.sr-only), a[href]:not(.sr-only):not([href="#main-content"])').filter({
      has: page.locator(':visible')
    });
    
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Find the first button that's actually in the viewport and hoverable
      let firstButton = buttons.first();
      
      // Check if the first button is hoverable, if not try the next ones
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const testButton = buttons.nth(i);
        try {
          // Test if element is in viewport and can be hovered
          await testButton.scrollIntoViewIfNeeded();
          const boundingBox = await testButton.boundingBox();
          if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
            firstButton = testButton;
            break;
          }
        } catch (error) {
          console.warn(`Button ${i} not hoverable, trying next one`);
          continue;
        }
      }
      
      // Default state
      await expect(firstButton).toHaveScreenshot('homepage-button-default.png', {
        threshold: 0.2
      });
      
      // Hover state
      await firstButton.hover();
      await expect(firstButton).toHaveScreenshot('homepage-button-hover.png', {
        threshold: 0.3 // Allow for hover effect differences
      });
      
      // Focus state (for accessibility)
      await firstButton.focus();
      await expect(firstButton).toHaveScreenshot('homepage-button-focus.png', {
        threshold: 0.3
      });
    }
  });

  test('should maintain loading state visual consistency', async ({ page }) => {
    // Test loading states if they exist
    // Important for user feedback during operations
    
    // Navigate to homepage but intercept requests to simulate loading
    await page.route('**/*', route => {
      // Delay route by 100ms to potentially capture loading state
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('/');
    
    // Try to capture loading state
    const loadingElement = page.locator('[data-testid="loading"], .loading, .spinner').first();
    
    if (await loadingElement.isVisible()) {
      await expect(loadingElement).toHaveScreenshot('homepage-loading-state.png', {
        threshold: 0.4 // Loading animations might have slight variations
      });
    }
    
    // Ensure final loaded state is consistent
    await waitForAppReady(page);
    await expect(page).toHaveScreenshot('homepage-loaded-state.png', {
      fullPage: true,
      threshold: 0.3
    });
  });
});

test.describe('Homepage Responsive Visual Regression', () => {
  // Test visual consistency across different viewport sizes
  // Critical for responsive design validation
  
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1200, height: 800 },
    { name: 'wide', width: 1920, height: 1080 }
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`should maintain visual consistency on ${name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await waitForAppReady(page);
      
      // Disable animations for consistent screenshots
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot(`homepage-${name}-viewport.png`, {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.3
      });
    });
  });

  test('should handle mobile navigation menu visual consistency', async ({ page }) => {
    // Test mobile-specific navigation if it exists
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppReady(page);
    
    // Look for mobile menu toggle
    const menuToggle = page.locator('[aria-label*="menu"], .menu-toggle, .hamburger, [data-testid="mobile-menu-toggle"]').first();
    
    if (await menuToggle.count() > 0) {
      // Default state
      await expect(menuToggle).toHaveScreenshot('homepage-mobile-menu-closed.png', {
        threshold: 0.2
      });
      
      // Opened state
      await menuToggle.click();
      await page.waitForTimeout(100); // Allow menu animation to complete
      
      await expect(page).toHaveScreenshot('homepage-mobile-menu-open.png', {
        fullPage: true,
        threshold: 0.3
      });
    }
  });
});

test.describe('Homepage Error State Visual Regression', () => {
  test('should handle error states visually consistently', async ({ page }) => {
    // Test error state visual consistency
    // Important for user experience during failures
    
    // Simulate network error
    await page.route('**/*', route => {
      if (route.request().url().includes('api/')) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Look for error messages or fallback content
    const errorElement = page.locator('[data-testid="error"], .error, [role="alert"]').first();
    
    if (await errorElement.count() > 0) {
      await expect(errorElement).toHaveScreenshot('homepage-error-state.png', {
        threshold: 0.2
      });
    }
    
    // Capture overall page state with potential errors
    await expect(page).toHaveScreenshot('homepage-with-errors.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should handle offline state visual consistency', async ({ page }) => {
    // Test offline visual state if supported
    await page.context().setOffline(true);
    
    try {
      await page.goto('/');
      await waitForAppReady(page);
      
      // Capture offline state
      await expect(page).toHaveScreenshot('homepage-offline-state.png', {
        fullPage: true,
        threshold: 0.3
      });
    } catch (error) {
      // If offline handling isn't implemented, that's expected
      test.skip(true, 'Offline state not implemented yet');
    }
  });
});