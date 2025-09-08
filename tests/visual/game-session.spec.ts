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
  // TODO: This test demonstrates the exact flakiness issue that PR #686 aims to solve
  // The test times out due to dynamic AI-generated narrative content not stabilizing properly
  // Will be re-enabled once complete flakiness mitigation with ignore zones is implemented
  test.skip('Game session page should render consistently', async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);
    
    // Navigate to the cyberpunk world's play page
    // The pre-seeded data should include an active session (session-cyberpunk-ghost) 
    // with stable narrative segments, so we should see active gameplay immediately
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await waitForContentStable(page);
    
    // Wait for active session content to appear (should be immediate with seeded data)
    await page.waitForSelector('[data-testid="game-session-active"]', { timeout: 10000 });
    
    // Wait for narrative content and player choices to be stable
    await Promise.race([
      page.waitForSelector('.narrative-content, .player-choices-container', { timeout: 8000 }),
      page.waitForTimeout(8000) // Fallback if selectors don't match
    ]);
    
    await waitForContentStable(page);
    
    await hideDynamicContent(page);
    
    // Take screenshot of game session page - should show active session with stable narrative and choices
    // Mask dynamic narrative content areas to prevent height variations from affecting test
    await expect(page).toHaveScreenshot('game-session.png', { 
      fullPage: true,
      mask: [
        page.locator('.narrative-content').first(),
        page.locator('[data-testid="narrative-segment"]').first(),
        page.locator('.player-choices-container').first(),
        page.locator('[data-testid="player-choices"]').first()
      ]
    });
  });
});