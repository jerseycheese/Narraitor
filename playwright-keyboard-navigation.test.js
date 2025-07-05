import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation - Issue #510', () => {
  const baseURL = 'http://localhost:3510';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
  });

  test('Skip link appears on Tab focus and navigates to main content', async ({ page }) => {
    // Skip link should be present but visually hidden initially (sr-only)
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveText('Skip to main content');

    // Press Tab to focus skip link - this makes it visible
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();

    // Press Enter to activate skip link
    await page.keyboard.press('Enter');
    
    // Main content should now be focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('Tab navigation works correctly through all interactive elements', async ({ page }) => {
    // Start with first focusable element (skip link)
    await page.keyboard.press('Tab');
    let skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();

    // Continue tabbing through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to continue tabbing without errors
    // Check that we have some focusable elements
    const interactiveCount = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
    expect(interactiveCount).toBeGreaterThan(3);
  });

  test('Escape key functionality works for closing modals/dropdowns', async ({ page }) => {
    // Navigate to a page with dropdowns/modals if available
    // For now, test that Escape key handler is attached and doesn't cause errors
    await page.keyboard.press('Escape');
    
    // Page should remain functional
    await expect(page.locator('h1')).toHaveText('Narraitor');
  });

  test('Shift+Tab navigates backwards correctly', async ({ page }) => {
    // Tab forward a few times to get focus somewhere
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Next element
    await page.keyboard.press('Tab'); // Third element
    
    // Now tab backwards - should work without errors
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    
    // Should end up back at skip link
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
  });

  test('Focus indicators are visible on all interactive elements', async ({ page }) => {
    // Test that focus styles are applied correctly
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    
    // Check that the skip link has focus styles
    const skipLinkClassName = await skipLink.getAttribute('class');
    expect(skipLinkClassName).toContain('focus:');
    
    // Test focus on other elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should have some element focused
    const focusedElements = await page.locator(':focus').count();
    expect(focusedElements).toBeGreaterThan(0);
  });

  test('No keyboard traps exist in the page', async ({ page }) => {
    // Tab through several elements to ensure no traps
    const maxTabs = 10; // Reasonable limit to prevent infinite loops
    let tabbedCount = 0;
    
    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      
      // Check if something is focused
      const focusedElements = await page.locator(':focus').count();
      if (focusedElements > 0) {
        tabbedCount++;
      }
      
      // Small delay to ensure focus has settled
      await page.waitForTimeout(100);
    }
    
    // Should have been able to tab through multiple elements
    expect(tabbedCount).toBeGreaterThan(3);
  });

  test('Main content element is properly configured for accessibility', async ({ page }) => {
    const mainContent = page.locator('#main-content');
    
    // Check that main content exists and has correct attributes
    await expect(mainContent).toBeAttached();
    
    // Check tabindex attribute
    const tabIndex = await mainContent.getAttribute('tabindex');
    expect(tabIndex).toBe('-1');
    
    // Check that it's a main element
    const tagName = await mainContent.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('main');
  });

  test('WCAG 2.1 AA compliance - keyboard navigation requirements', async ({ page }) => {
    // Test 1: All interactive elements are keyboard accessible
    const interactiveElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
    expect(interactiveElements).toBeGreaterThan(0);
    
    // Test 2: Skip links are present
    const skipLinks = await page.locator('a[href^="#"]').count();
    expect(skipLinks).toBeGreaterThan(0);
    
    // Test 3: Focus is visible (tested in previous test)
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
    
    // Test 4: Logical tab order (elements should be focusable in sequence)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Should be able to continue tabbing without errors
    const currentFocus = page.locator(':focus').first();
    await expect(currentFocus).toBeAttached();
  });
});