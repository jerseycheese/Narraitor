import { test, expect } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { hideDynamicContent } from './utils/wait-helpers';

/**
 * Manuscript Layout Specific Visual Tests
 * 
 * Verifies the specific components and interactions unique to the 
 * single-column manuscript layout, including the skeleton state
 * and floating HUD interactions.
 */

test.describe('Manuscript Layout Specific Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER PAGE ERROR: ${err.message}`));
  });

  test('Manuscript Skeleton should render consistently', async ({ page }) => {
    // Seed full data
    await seedTestData(page);
    await mockApiEndpoints(page);
    
    await page.goto('/worlds/world-cyberpunk-2077/play');

    // Wait for initial load
    await page.waitForSelector('[data-testid="manuscript-session-shell"]');

    // Manually trigger skeleton by clearing segments in store
    await page.evaluate(() => {
      if ((window as any).useNarrativeStore) {
        const sessionId = 'session-cyberpunk-ghost';
        const store = (window as any).useNarrativeStore;
        store.setState({
          sessionSegments: { [sessionId]: [] }
        });
      }
    });
    
    // Wait for skeleton test anchor
    await page.waitForSelector('[data-testid="game-session-skeleton"]', { state: 'attached', timeout: 5000 });
    
    // Slight wait for any animations to settle
    await page.waitForTimeout(500);
    
    await hideDynamicContent(page);
    
    await expect(page).toHaveScreenshot('manuscript-skeleton.png', {
      fullPage: true,
    });
  });

  test('HUD Character Summary should toggle and render panel', async ({ page }) => {
    // Seed full test data including narrative segments
    await seedTestData(page);
    await mockApiEndpoints(page);
    
    await page.goto('/worlds/world-cyberpunk-2077/play');
    
    // Wait for the main manuscript shell to load
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 10000 });
    
    // Find the character summary toggle in the HUD
    const hudToggle = page.getByRole('button', { name: /character summary/i });
    await expect(hudToggle).toBeVisible();
    
    // Click to expand the summary panel
    await hudToggle.click();
    
    // Wait for the panel to appear (ActiveGameSession passes CharacterSummary into the panel slot)
    await page.waitForSelector('[data-testid="character-summary"]');
    
    // Wait for animation transition (200ms duration in component)
    await page.waitForTimeout(500);
    
    await hideDynamicContent(page);
    
    // Target the snapshot to the HUD area to focus on the expanded panel
    await expect(page).toHaveScreenshot('manuscript-hud-expanded.png');
  });

  test('Immersive Header and Action Rail should be visible in session', async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);
    
    await page.goto('/worlds/world-cyberpunk-2077/play');
    
    // Wait for the main manuscript shell to load
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 10000 });
    
    // Verify layout anchors
    await expect(page.locator('[data-testid="manuscript-session-shell"]')).toBeVisible();
    await expect(page.locator('[data-testid="manuscript-action-rail"]')).toBeVisible();
    await expect(page.locator('header.fixed.top-0')).toBeVisible(); // The minimal header
    
    await hideDynamicContent(page);
    
    // Capture full viewport to see header and rail together
    await expect(page).toHaveScreenshot('manuscript-full-composition.png', {
      fullPage: true,
    });
  });
});
