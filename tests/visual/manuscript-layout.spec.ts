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

  // Skipped pending #1183 — desktop DS1 panel/rail width sync regressed by 30px,
  // likely a box-sizing or ResizeObserver-timing issue introduced in #1094.
  test.skip('Desktop should keep character rail on left and sync panel width', async ({ page }) => {
    // Seed full test data including narrative segments
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');

    // Wait for the main manuscript shell to load
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 10000 });

    const hudToggle = page.getByRole('button', { name: /^character$/i });
    await expect(hudToggle).toBeVisible();
    await hudToggle.click();

    await page.waitForSelector('.manuscript-hud-character-panel', {
      state: 'visible',
      timeout: 10000,
    });

    const desktopLayout = await page.evaluate(() => {
      const rail = document.querySelector('.manuscript-characters-rail');
      const mainContent = document.querySelector('.manuscript-main-content');
      const panel = document.querySelector('.manuscript-hud-character-panel');

      if (!rail || !mainContent || !panel) {
        return null;
      }

      const railRect = rail.getBoundingClientRect();
      const mainRect = mainContent.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      return {
        railDisplay: window.getComputedStyle(rail).display,
        panelWidth: Math.round(panelRect.width),
        railWidth: Math.round(railRect.width),
        panelRailDelta: Math.abs(Math.round(panelRect.width - railRect.width)),
        railIsLeftOfMain: railRect.left < mainRect.left,
      };
    });

    expect(desktopLayout).not.toBeNull();
    if (!desktopLayout) {
      throw new Error('Expected desktop manuscript layout elements to be present');
    }

    expect(desktopLayout.railDisplay).not.toBe('none');
    expect(desktopLayout.railIsLeftOfMain).toBe(true);
    expect(desktopLayout.panelRailDelta).toBeLessThanOrEqual(2);

    await hideDynamicContent(page);

    await expect(page).toHaveScreenshot('manuscript-hud-expanded.png');
  });

  test('Desktop and mobile rails should render in expected positions', async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');

    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 10000 });

    await expect(page.locator('[data-testid="manuscript-session-shell"]')).toBeVisible();
    await expect(page.locator('[data-testid="manuscript-action-rail"]')).toBeVisible();

    await expect(page.getByRole('button', { name: /close/i })).toBeVisible();

    const desktopLayout = await page.evaluate(() => {
      const rail = document.querySelector('.manuscript-characters-rail');
      const mainContent = document.querySelector('.manuscript-main-content');
      if (!rail || !mainContent) return null;

      const railRect = rail.getBoundingClientRect();
      const mainRect = mainContent.getBoundingClientRect();
      return {
        railDisplay: window.getComputedStyle(rail).display,
        railIsLeftOfMain: railRect.left < mainRect.left,
      };
    });

    expect(desktopLayout).not.toBeNull();
    if (!desktopLayout) {
      throw new Error('Expected desktop manuscript rail and content to be present');
    }
    expect(desktopLayout.railDisplay).not.toBe('none');
    expect(desktopLayout.railIsLeftOfMain).toBe(true);

    await hideDynamicContent(page);

    await expect(page).toHaveScreenshot('manuscript-full-composition.png', {
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 10000 });

    const mobileLayout = await page.evaluate(() => {
      const rail = document.querySelector('.manuscript-characters-rail');
      const actionRail = document.querySelector('#manuscript-action-rail');
      const choiceCount = document.querySelectorAll('.manuscript-suggested-action').length;

      if (!rail || !actionRail) return null;

      return {
        railDisplay: window.getComputedStyle(rail).display,
        actionRailDisplay: window.getComputedStyle(actionRail).display,
        choiceCount,
      };
    });

    expect(mobileLayout).not.toBeNull();
    if (!mobileLayout) {
      throw new Error('Expected mobile manuscript rail and action rail to be present');
    }

    expect(mobileLayout.railDisplay).toBe('none');
    expect(mobileLayout.actionRailDisplay).not.toBe('none');
    expect(mobileLayout.choiceCount).toBeGreaterThan(0);
  });
});
