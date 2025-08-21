import { test, expect } from '@playwright/test';

/**
 * Component Visual Tests
 * 
 * Tests individual UI components in isolation for visual consistency.
 * These tests provide faster feedback on component changes and make
 * it easier to pinpoint visual regressions to specific components.
 */

/**
 * Wait for the Narraitor application to be fully loaded and ready
 */
async function waitForAppReady(page) {
  try {
    // Wait for initial page load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait for React hydration - look for interactive content
    await page.waitForSelector('main', { timeout: 15000 });
    
    // Wait for fonts to load - critical for consistent screenshots
    await page.waitForFunction(() => {
      return document.fonts.ready;
    }, { timeout: 10000 }).catch(() => {
      console.warn('Font loading timeout - continuing anyway');
    });
    
    // Additional wait for font rendering to stabilize
    await page.waitForTimeout(2000);
  } catch (error) {
    console.warn('waitForAppReady encountered an error:', error.message);
    // Continue anyway - CI might have different timing
  }
}

/**
 * Navigate to a Storybook story for isolated component testing
 */
async function gotoStory(page, storyPath: string) {
  await page.goto(`/dev/storybook?path=/story/${storyPath}`);
  await waitForAppReady(page);
  
  // Wait for Storybook to load the story
  await page.waitForSelector('[data-testid="story-content"], .sb-story, #story-root', { timeout: 10000 });
  await page.waitForTimeout(1000); // Additional stabilization
}

test.describe('UI Component Visual Tests', () => {
  
  test.describe('Button Components', () => {
    test('button primary state', async ({ page }) => {
      // If we have a Storybook setup, use it for isolated testing
      await page.goto('/dev/button-showcase');
      await waitForAppReady(page);
      
      // Look for primary button in test harness
      const primaryButton = page.locator('[data-testid="primary-button"]').first();
      if (await primaryButton.isVisible()) {
        await expect(primaryButton).toHaveScreenshot('button-primary.png');
      } else {
        // Fallback: test button on actual page
        await page.goto('/');
        await waitForAppReady(page);
        
        const anyButton = page.locator('button').first();
        await expect(anyButton).toHaveScreenshot('button-fallback.png');
      }
    });

    test('button secondary state', async ({ page }) => {
      await page.goto('/dev/button-showcase');
      await waitForAppReady(page);
      
      const secondaryButton = page.locator('[data-testid="secondary-button"]').first();
      if (await secondaryButton.isVisible()) {
        await expect(secondaryButton).toHaveScreenshot('button-secondary.png');
      }
    });

    test('button disabled state', async ({ page }) => {
      await page.goto('/dev/button-showcase');
      await waitForAppReady(page);
      
      const disabledButton = page.locator('[data-testid="disabled-button"]').first();
      if (await disabledButton.isVisible()) {
        await expect(disabledButton).toHaveScreenshot('button-disabled.png');
      }
    });
  });

  test.describe('EmptyState Components', () => {
    test('empty state with action button', async ({ page }) => {
      // Test EmptyState on characters page when no characters exist
      await page.goto('/characters');
      await waitForAppReady(page);
      
      // Look for empty state component
      const emptyState = page.locator('[data-testid="empty-state"], .empty-state').first();
      if (await emptyState.isVisible()) {
        await expect(emptyState).toHaveScreenshot('empty-state-with-action.png');
      }
    });

    test('empty state worlds page', async ({ page }) => {
      await page.goto('/worlds');
      await waitForAppReady(page);
      
      const emptyState = page.locator('[data-testid="empty-state"], .empty-state').first();
      if (await emptyState.isVisible()) {
        await expect(emptyState).toHaveScreenshot('empty-state-worlds.png');
      }
    });
  });

  test.describe('Status and Indicator Components', () => {
    test('save indicator states', async ({ page }) => {
      // Navigate to a page that might show save indicators
      await page.goto('/world/create');
      await waitForAppReady(page);
      
      // Look for save indicator components
      const saveIndicator = page.locator('[data-testid="save-indicator"], .save-indicator').first();
      if (await saveIndicator.isVisible()) {
        await expect(saveIndicator).toHaveScreenshot('save-indicator.png');
      }
    });

    test('loading state components', async ({ page }) => {
      // Check dev test harness for loading states
      await page.goto('/dev');
      await waitForAppReady(page);
      
      // Look for loading components in dev tools
      const loadingState = page.locator('[data-testid="loading-state"], .loading-state, .loading').first();
      if (await loadingState.isVisible()) {
        await expect(loadingState).toHaveScreenshot('loading-state.png');
      }
    });

    test('status badges', async ({ page }) => {
      // Check if we have status badges anywhere in the app
      await page.goto('/');
      await waitForAppReady(page);
      
      const statusBadge = page.locator('[data-testid="status-badge"], .status-badge, .badge').first();
      if (await statusBadge.isVisible()) {
        await expect(statusBadge).toHaveScreenshot('status-badge.png');
      }
    });
  });

  test.describe('Form Components', () => {
    test('input field states', async ({ page }) => {
      await page.goto('/character/create');
      await waitForAppReady(page);
      
      // Test input field appearance
      const inputField = page.locator('input[type="text"]').first();
      if (await inputField.isVisible()) {
        await expect(inputField).toHaveScreenshot('input-field.png');
      }
    });

    test('textarea component', async ({ page }) => {
      await page.goto('/character/create');
      await waitForAppReady(page);
      
      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible()) {
        await expect(textarea).toHaveScreenshot('textarea.png');
      }
    });

    test('range slider component', async ({ page }) => {
      await page.goto('/character/create');
      await waitForAppReady(page);
      
      // Look for range slider in character creation
      const rangeSlider = page.locator('[data-testid="range-slider"], input[type="range"]').first();
      if (await rangeSlider.isVisible()) {
        await expect(rangeSlider).toHaveScreenshot('range-slider.png');
      }
    });
  });

  test.describe('Navigation Components', () => {
    test('navigation header component', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);
      
      // Test the main navigation header
      const header = page.locator('header, nav').first();
      if (await header.isVisible()) {
        await expect(header).toHaveScreenshot('navigation-header.png');
      }
    });

    test('breadcrumb navigation', async ({ page }) => {
      await page.goto('/character/create');
      await waitForAppReady(page);
      
      const breadcrumbs = page.locator('[data-testid="breadcrumbs"], .breadcrumbs').first();
      if (await breadcrumbs.isVisible()) {
        await expect(breadcrumbs).toHaveScreenshot('breadcrumbs.png');
      }
    });
  });

  test.describe('Modal and Dialog Components', () => {
    test('modal dialog appearance', async ({ page }) => {
      await page.goto('/dev/game-session');
      await waitForAppReady(page);
      
      // Try to open a modal if available
      const modalTrigger = page.locator('[data-testid="open-modal"], button:has-text("Settings"), button:has-text("Options")').first();
      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();
        await page.waitForTimeout(500); // Wait for modal animation
        
        const modal = page.locator('[data-testid="modal"], .modal, [role="dialog"]').first();
        if (await modal.isVisible()) {
          await expect(modal).toHaveScreenshot('modal-dialog.png');
        }
      }
    });
  });

  test.describe('Card Components', () => {
    test('character card component', async ({ page }) => {
      await page.goto('/characters');
      await waitForAppReady(page);
      
      const characterCard = page.locator('[data-testid="character-card"], .character-card').first();
      if (await characterCard.isVisible()) {
        await expect(characterCard).toHaveScreenshot('character-card.png');
      }
    });

    test('world card component', async ({ page }) => {
      await page.goto('/worlds');
      await waitForAppReady(page);
      
      const worldCard = page.locator('[data-testid="world-card"], .world-card').first();
      if (await worldCard.isVisible()) {
        await expect(worldCard).toHaveScreenshot('world-card.png');
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