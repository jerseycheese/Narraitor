import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData } from './utils/data-seeder';

/**
 * Main Pages Visual Regression Tests
 * 
 * Tests core application pages for visual consistency.
 * Covers both empty states (first-time users) and populated states (returning users).
 */

test.describe('Main Pages Visual Tests', () => {
  test('Home page should render consistently (empty state)', async ({ page }) => {
    // Ensure truly empty state by clearing any test data
    await page.addInitScript(() => {
      // Clear window globals
      delete (window as any).__TEST_WORLDS__;
      delete (window as any).__TEST_CHARACTERS__;
      delete (window as any).__TEST_SESSIONS__;
      delete (window as any).__TEST_CURRENT_WORLD_ID__;
      delete (window as any).__TEST_SEEDED__;
      
      // Clear localStorage to ensure no persisted data
      localStorage.clear();
      
      // Also clear any specific store keys
      try {
        localStorage.removeItem('narraitor-world-store');
        localStorage.removeItem('narraitor-character-store');
        localStorage.removeItem('narraitor-session-store');
        localStorage.removeItem('narraitor-narrative-store');
      } catch (e) {
        // Ignore errors
      }
    });
    
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
    // Ensure truly empty state by clearing any test data
    await page.addInitScript(() => {
      // Clear window globals
      delete (window as any).__TEST_WORLDS__;
      delete (window as any).__TEST_CHARACTERS__;
      delete (window as any).__TEST_SESSIONS__;
      delete (window as any).__TEST_CURRENT_WORLD_ID__;
      delete (window as any).__TEST_SEEDED__;
      
      // Clear localStorage to ensure no persisted data
      localStorage.clear();
      
      // Also clear any specific store keys
      try {
        localStorage.removeItem('narraitor-world-store');
        localStorage.removeItem('narraitor-character-store');
        localStorage.removeItem('narraitor-session-store');
        localStorage.removeItem('narraitor-narrative-store');
      } catch (e) {
        // Ignore errors
      }
    });
    
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
    await seedTestData(page);
    
    // Navigate to world edit page
    await page.goto('/worlds/world-cyberpunk-2077/edit');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of world edit page - should show world editing interface
    await expect(page).toHaveScreenshot('world-edit.png', { fullPage: true });
  });

  test('Character edit page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to character edit page
    await page.goto('/characters/char-cyberpunk-hacker/edit');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of character edit page - should show character editing interface
    await expect(page).toHaveScreenshot('character-edit.png', { fullPage: true });
  });
});