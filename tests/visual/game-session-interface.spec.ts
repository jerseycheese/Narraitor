import { test, expect } from '@playwright/test';
import { waitForGameSessionReady } from './utils/testHelpers';

/**
 * Game Session Interface Visual Tests
 * 
 * Tests the core game session interfaces including narrative display,
 * choice selection, and game controls. These are critical for the
 * primary user experience of Narraitor.
 */

test.describe('Game Session Visual Interface Tests', () => {
  test('game session startup and loading states', async ({ page }) => {
    // Navigate to the play page
    await page.goto('/play');
    await waitForGameSessionReady(page);
    
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
    await waitForGameSessionReady(page);
    
    // Focus on testing the UI structure, not AI content (2025 best practice)
    // Mask the entire dynamic content areas that contain AI-generated text
    const dynamicContentAreas = [
      // Mask the entire narrative paragraph content (AI-generated)
      page.locator('p').filter({ hasText: /The .* (adventure|quest|journey|path)/ }),
      // Mask session IDs, timestamps, and option IDs
      page.locator('text=/session-world-\\d+-test-character-\\d+-\\d+/'),
      page.locator('text=/\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/'),
      page.locator('text=/option_[a-f0-9-]+/'),
      // Mask the specific choice text which varies with AI generation
      page.locator('[role="radiogroup"] label'),
    ];
    
    // Take screenshot focusing on layout and structure, not content
    await expect(page).toHaveScreenshot('game-session-dev-harness.png', {
      fullPage: true,
      animations: 'disabled',
      // Mask all dynamic AI content areas
      mask: dynamicContentAreas,
      // More permissive settings for content that changes
      maxDiffPixels: 10000, // Very high tolerance for masked areas
      threshold: 0.5        // 50% tolerance for differences
    });
    
    // Test static UI components separately for better stability
    const characterInfoSection = page.locator('region[aria-label*="Character information"], [data-testid="character-info"]');
    if (await characterInfoSection.isVisible()) {
      await expect(characterInfoSection).toHaveScreenshot('character-info-section.png', {
        maxDiffPixels: 500,
        threshold: 0.2
      });
    }
    
    // Test game controls area (buttons, static UI elements)
    const gameControls = page.locator('button').filter({ hasText: /Start New Session|End Session|Reset State/ }).first().locator('..');
    if (await gameControls.isVisible()) {
      await expect(gameControls).toHaveScreenshot('game-controls-section.png', {
        maxDiffPixels: 300,
        threshold: 0.1
      });
    }
  });

  test('game controls and interface elements', async ({ page }) => {
    // Test dev tools interface for game controls
    await page.goto('/dev/devtools-test');
    await waitForGameSessionReady(page);
    
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
    await waitForGameSessionReady(page);
    
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
    await waitForGameSessionReady(page);
    
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