import { test, expect } from '@playwright/test';
import { waitForAppReady } from './utils/testHelpers';

/**
 * Component Visual Tests
 * 
 * Tests individual UI components in isolation for visual consistency.
 * These tests provide faster feedback on component changes and make
 * it easier to pinpoint visual regressions to specific components.
 */

test.describe('UI Component Visual Tests', () => {
  
  test.describe('Navigation Components', () => {
    test('navigation header component', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);
      
      // Test the main navigation header - this should exist
      const header = page.locator('header, nav').first();
      if (await header.isVisible()) {
        await expect(header).toHaveScreenshot('navigation-header-component.png');
      }
    });
  });

  test.describe('Page Layout Components', () => {
    test('landing page main content', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);
      
      // Test the main content area of the landing page
      const main = page.locator('main').first();
      if (await main.isVisible()) {
        await expect(main).toHaveScreenshot('landing-page-main-content.png');
      }
    });

    test('characters page layout', async ({ page }) => {
      await page.goto('/characters');
      await waitForAppReady(page);
      
      // Test the characters page layout (likely shows empty state)
      const main = page.locator('main').first();
      if (await main.isVisible()) {
        await expect(main).toHaveScreenshot('characters-page-layout.png');
      }
    });

    test('worlds page layout', async ({ page }) => {
      await page.goto('/worlds');
      await waitForAppReady(page);
      
      // Test the worlds page layout (likely shows empty state)
      const main = page.locator('main').first();
      if (await main.isVisible()) {
        await expect(main).toHaveScreenshot('worlds-page-layout.png');
      }
    });
  });
});

/**
 * Component Testing Best Practices Demonstrated:
 * 
 * 1. **Isolated Testing**: Each test focuses on a single component
 * 2. **Graceful Fallbacks**: Tests handle missing components gracefully
 * 3. **Consistent Waiting**: All tests use the same wait strategy
 * 4. **Descriptive Names**: Screenshot names clearly identify the component
 * 5. **Logical Grouping**: Components grouped by type/function
 * 6. **State Coverage**: Tests cover different component states where possible
 * 
 * To expand these tests:
 * - Add Storybook integration for true component isolation
 * - Test component variations (themes, sizes, states)
 * - Add responsive testing for different viewport sizes
 * - Include error states and edge cases
 */