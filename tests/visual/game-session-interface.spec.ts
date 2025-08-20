import { test, expect } from '@playwright/test';

/**
 * Game Session Interface Visual Tests
 * 
 * Tests the core game session interfaces including narrative display,
 * choice selection, and game controls. These are critical for the
 * primary user experience of Narraitor.
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
    
    // Give additional time for dynamic content and avoid loading screens
    await page.waitForTimeout(3000);
    
    // Check if we can see actual content (not just loading)
    const loadingVisible = await page.locator('text=Loading').isVisible().catch(() => false);
    
    if (loadingVisible) {
      console.warn('Application still showing loading screen - may not have fully loaded');
      // Wait a bit more and try again
      await page.waitForTimeout(5000);
    }
  } catch (error) {
    console.warn('waitForAppReady encountered an error:', error.message);
    // Continue anyway - CI might have different timing
  }
}

test.describe('Game Session Visual Interface Tests', () => {
  test('game session startup and loading states', async ({ page }) => {
    // Navigate to the play page
    await page.goto('/play');
    await waitForAppReady(page);
    
    // Take screenshot of play page initial state
    await expect(page).toHaveScreenshot('play-page-initial.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test any loading or onboarding components
    const loadingState = page.locator('[data-testid="loading-state"]').first();
    if (await loadingState.isVisible()) {
      await expect(loadingState).toHaveScreenshot('game-loading-state.png');
    }
  });

  test('narrative display and text formatting', async ({ page }) => {
    // Use dev harness for testing narrative components
    await page.goto('/dev/game-session');
    await waitForAppReady(page);
    
    // Take screenshot of game session test harness
    await expect(page).toHaveScreenshot('game-session-dev-harness.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test narrative display component if visible
    const narrativeDisplay = page.locator('[data-testid="narrative-display"]').first();
    if (await narrativeDisplay.isVisible()) {
      await expect(narrativeDisplay).toHaveScreenshot('narrative-display-component.png');
    }
    
    // Test choice selector component if visible
    const choiceSelector = page.locator('[data-testid="choice-selector"]').first();
    if (await choiceSelector.isVisible()) {
      await expect(choiceSelector).toHaveScreenshot('choice-selector-component.png');
    }
  });

  test('game controls and interface elements', async ({ page }) => {
    // Test dev tools interface for game controls
    await page.goto('/dev/devtools-test');
    await waitForAppReady(page);
    
    // Take screenshot of dev tools test interface
    await expect(page).toHaveScreenshot('devtools-test-interface.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test any game control panels
    const gameControls = page.locator('[data-testid="game-controls"]').first();
    if (await gameControls.isVisible()) {
      await expect(gameControls).toHaveScreenshot('game-controls-panel.png');
    }
  });

  test('journal and progress tracking interface', async ({ page }) => {
    // Test journal access dev interface
    await page.goto('/dev/journal-access');
    await waitForAppReady(page);
    
    // Take screenshot of journal interface
    await expect(page).toHaveScreenshot('journal-interface.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test journal modal if visible
    const journalModal = page.locator('[data-testid="journal-modal"]').first();
    if (await journalModal.isVisible()) {
      await expect(journalModal).toHaveScreenshot('journal-modal-component.png');
    }
  });

  test('ending and completion screens', async ({ page }) => {
    // Test ending screen interface
    await page.goto('/dev/ending-screen');
    await waitForAppReady(page);
    
    // Take screenshot of ending screen
    await expect(page).toHaveScreenshot('ending-screen-interface.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test ending summary components if visible
    const endingSummary = page.locator('[data-testid="ending-summary"]').first();
    if (await endingSummary.isVisible()) {
      await expect(endingSummary).toHaveScreenshot('ending-summary-component.png');
    }
  });
});