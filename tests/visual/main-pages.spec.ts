import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, waitForInteraction, expandAllCollapsibleSections } from './utils/wait-helpers';
import { seedTestData, seedBaseData } from './utils/data-seeder';

/**
 * Main Pages Visual Regression Tests
 * 
 * Tests core application pages for visual consistency.
 * Covers both empty states (first-time users) and populated states (returning users).
 */

test.describe('Main Pages Visual Tests', () => {
  test('Home page should render consistently (empty state)', async ({ page }) => {
    // Use base seeding for empty state - much faster than clearing everything manually
    await seedBaseData(page);
    
    await page.goto('/');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Verify page loaded with expected content
    await expect(page).toHaveTitle(/Narraitor/i);
    
    // Take full page screenshot - empty QuickPlay form
    await expect(page).toHaveScreenshot('home-empty-state.png', { fullPage: true });
  });

  test('Home page should render consistently', async ({ page }) => {
    // Seed test data to show returning user with recent game session
    await seedTestData(page);
    await page.goto('/');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Verify page loaded with expected content
    await expect(page).toHaveTitle(/Narraitor/i);
    
    // Take full page screenshot - should show "Continue Last Game" with character and world info
    await expect(page).toHaveScreenshot('home-page.png', { fullPage: true });
  });

  test('Settings page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    await page.goto('/settings');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of settings page
    await expect(page).toHaveScreenshot('settings.png', { fullPage: true });
  });

  test('Worlds list page should render consistently (empty state)', async ({ page }) => {
    // Use base seeding for empty state - much faster and more reliable
    await seedBaseData(page);
    
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of worlds page - shows empty state with onboarding
    await expect(page).toHaveScreenshot('worlds-list-empty-state.png', { fullPage: true });
  });

  test('Worlds list page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to worlds page to see populated data
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of worlds page - should show populated worlds
    await expect(page).toHaveScreenshot('worlds-list.png', { fullPage: true });
  });

  test('Characters list page should render consistently', async ({ page }) => {
    await seedTestData(page);
    await page.goto('/characters');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of characters page - should show populated characters
    await expect(page).toHaveScreenshot('characters-list.png', { fullPage: true });
  });

  test('World detail page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to the cyberpunk world detail page
    await page.goto('/worlds/world-cyberpunk-2077');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of world detail page - should show world info, characters, and actions
    await expect(page).toHaveScreenshot('world-detail.png', { fullPage: true });
  });

  test('Character detail page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to Nova character detail page
    await page.goto('/characters/char-cyberpunk-hacker');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of character detail page - should show character sheet, attributes, skills
    await expect(page).toHaveScreenshot('character-detail.png', { fullPage: true });
  });

  test('World edit page should render consistently', async ({ page }) => {
    test.setTimeout(45000); // Extended timeout for complex edit page with CollapsibleSections
    await seedTestData(page);
    
    // Force reload world store from seeded data before navigating
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        // Wait for stores to be available
        const checkAndLoadStores = () => {
          const worldStore = (window as any).useWorldStore;
          const testWorlds = (window as any).__TEST_WORLDS__;
          
          if (worldStore && testWorlds) {
            console.log('Forcing world store reload with seeded data');
            console.log('Available worlds:', Object.keys(testWorlds));
            
            worldStore.setState({
              worlds: testWorlds,
              currentWorldId: 'world-cyberpunk-2077',
              loading: false,
              error: null
            });
            
            // Verify the store was updated
            const state = worldStore.getState();
            console.log('World store state after update:', {
              worldKeys: Object.keys(state.worlds || {}),
              currentWorldId: state.currentWorldId,
              hasCyberpunkWorld: !!state.worlds?.['world-cyberpunk-2077']
            });
            
            resolve();
          } else {
            console.log('Stores not ready yet, retrying...', { hasWorldStore: !!worldStore, hasTestWorlds: !!testWorlds });
            setTimeout(checkAndLoadStores, 100);
          }
        };
        
        checkAndLoadStores();
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(), 5000);
      });
    });
    
    // Navigate to world edit page
    await page.goto('/worlds/world-cyberpunk-2077/edit');
    await waitForContentStable(page);
    
    // Debug: Check if we're on the right page
    const pageTitle = await page.textContent('h1, [data-testid="page-title"], .page-title');
    console.log('World edit page title:', pageTitle);
    
    // Check if world data is available in the store
    const worldStoreData = await page.evaluate(() => {
      const worldStore = (window as any).__TEST_WORLDS__;
      const hasWorld = worldStore && worldStore['world-cyberpunk-2077'];
      return {
        hasTestWorlds: !!worldStore,
        worldKeys: worldStore ? Object.keys(worldStore) : [],
        hasCyberpunkWorld: hasWorld,
        worldData: hasWorld ? worldStore['world-cyberpunk-2077'] : null
      };
    });
    console.log('World store data check:', worldStoreData);
    
    // Also check Zustand store
    const zustandStoreData = await page.evaluate(() => {
      const zustand = (window as any).useWorldStore;
      if (!zustand) return { hasStore: false };
      
      const state = zustand.getState();
      return {
        hasStore: true,
        worlds: state.worlds ? Object.keys(state.worlds) : [],
        hasCyberpunkWorld: !!state.worlds?.['world-cyberpunk-2077']
      };
    });
    console.log('Zustand world store check:', zustandStoreData);
    
    // Wait for world data to load and verify we're on edit page
    await page.waitForFunction(() => {
      return document.body.textContent && 
             !document.body.textContent.includes('World not found') &&
             !document.body.textContent.includes('Return to Worlds') &&
             (document.body.textContent.includes('Edit World') || 
              document.body.textContent.includes('Basic Information') ||
              document.body.textContent.includes('WorldEditor'));
    }, { timeout: 15000 }).catch(async () => {
      // If we can't find the edit page content, check what we actually have
      const currentContent = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          bodyText: document.body.textContent?.substring(0, 500),
          hasEditWorld: document.body.textContent?.includes('Edit World'),
          hasWorldNotFound: document.body.textContent?.includes('World not found'),
          hasReturnToWorlds: document.body.textContent?.includes('Return to Worlds'),
          hasBasicInfo: document.body.textContent?.includes('Basic Information')
        };
      });
      console.log('Page content when world edit page failed to load:', currentContent);
      throw new Error(`World edit page failed to load properly. Current URL: ${currentContent.url}`);
    });
    
    await hideDynamicContent(page);
    
    // Expand all CollapsibleSections to show full content
    await expandAllCollapsibleSections(page);
    
    // Take screenshot of world edit page - should show world editing interface with all sections expanded
    await expect(page).toHaveScreenshot('world-edit.png', { fullPage: true });
  });

  test('Character edit page should render consistently', async ({ page }) => {
    test.setTimeout(45000); // Extended timeout for complex edit page with CollapsibleSections
    await seedTestData(page);
    
    // Navigate to character edit page
    await page.goto('/characters/char-cyberpunk-hacker/edit');
    await waitForContentStable(page);
    
    // Debug: Check if we're on the right page
    const pageTitle = await page.textContent('h1, [data-testid="page-title"], .page-title');
    console.log('Character edit page title:', pageTitle);
    
    // Wait for character data to load
    await page.waitForFunction(() => {
      return document.body.textContent && 
             !document.body.textContent.includes('Character not found') &&
             (document.body.textContent.includes('Edit Character') || document.body.textContent.includes('CharacterEditor'));
    }, { timeout: 10000 });
    
    await hideDynamicContent(page);
    
    // Debug: Check how many CollapsibleSections exist before expansion
    const totalSections = await page.locator('[data-testid="collapsible-section"]').count();
    console.log(`Found ${totalSections} total CollapsibleSections on character edit page`);
    
    // Debug: Check how many are collapsed before expansion
    const collapsedSections = await page.locator('[data-testid="collapsible-section-toggle"]').filter({
      hasText: '+'
    }).count();
    console.log(`Found ${collapsedSections} collapsed sections before expansion`);
    
    // Expand all CollapsibleSections to show full content
    await expandAllCollapsibleSections(page);
    
    // Debug: Check how many are still collapsed after expansion
    const stillCollapsed = await page.locator('[data-testid="collapsible-section-toggle"]').filter({
      hasText: '+'
    }).count();
    console.log(`Found ${stillCollapsed} collapsed sections after expansion`);
    
    // Take screenshot of character edit page - should show character editing interface with all sections expanded
    await expect(page).toHaveScreenshot('character-edit.png', { fullPage: true });
  });
});