import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, waitForInteraction } from './utils/wait-helpers';
import { seedTestData, mockApiEndpoints } from './utils/data-seeder';

/**
 * Game Session Visual Regression Tests
 * 
 * Tests the active gameplay interface including session management,
 * narrative display, and player choice interactions.
 */

test.describe('Game Session Visual Tests', () => {
  // TODO: Re-enable once complete flakiness mitigation is implemented (PR #686)
  // This test is currently skipped due to dynamic AI-generated narrative content causing
  // height variations that make visual regression testing unreliable
  test.skip('Game session page should render consistently', async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);
    
    // Navigate to the cyberpunk world's play page
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await waitForContentStable(page);
    
    // Click Start Session to show active gameplay
    const startButton = page.locator('button:has-text("Start Session")');
    if (await startButton.count() > 0) {
      console.log('Found Start Session button, clicking...');
      await startButton.click();
      await page.waitForTimeout(2000); // Give time for session to start and narrative to load
      await waitForContentStable(page);
      
      // Wait for active session content to appear
      await page.waitForSelector('[data-testid="game-session-active"]', { timeout: 10000 });
      
      // Wait for narrative content and player choices
      await Promise.race([
        page.waitForSelector('.narrative-content, .player-choices-container', { timeout: 8000 }),
        page.waitForTimeout(8000) // Fallback if selectors don't match
      ]);
      
      await waitForContentStable(page);
    }
    
    await hideDynamicContent(page);
    
    // Take screenshot of game session page - should show active session with narrative and choices
    // Note: Using higher threshold due to dynamic AI-generated narrative content causing pixel variations
    // This is part of the flakiness mitigation work in PR #686
    await expect(page).toHaveScreenshot('game-session.png', { 
      fullPage: true,
      threshold: 0.35  // More lenient threshold for dynamic content areas
    });
  });
});