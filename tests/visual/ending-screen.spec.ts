import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData, mockApiEndpoints } from './utils/data-seeder';

/**
 * EndingScreen Visual Regression Tests
 * 
 * Tests the story ending screen display with different emotional tones using the actual user flow.
 * Follows Playwright best practices by testing the real user journey.
 */

test.describe('EndingScreen Visual Tests', () => {
  
  test('EndingScreen - Triumphant ending should render consistently', async ({ page }) => {
    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Mock the narrative ending API to return a triumphant ending
    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'With the city liberated and the syndicate dismantled, your legend spreads through Neo-Tokyo. The skyline gleams brighter than ever.',
            characterLegacy: 'Nova Ghost Chen becomes a symbol of resistance, inspiring a new generation of free minds.',
            worldImpact: 'Corporate overreach is pushed back; citizens regain control over their data and lives.',
            tone: 'triumphant',
            achievements: ['Master Hacker: Outsmarted corporate AI', 'City Savior: Freed Neo-Tokyo'],
            playTime: 1234
          }
        }
      });
    });

    // Navigate to the real play route
    await page.goto('/worlds/world-cyberpunk-2077/play');
    // Wait for active session UI
    await page.waitForSelector('[data-testid="game-session-active"]', { timeout: 10000 });

    // Trigger End Story and confirm in dialog (light settle only)
    await page.waitForTimeout(100);
    const endButton = page.getByTestId('game-session-end-story');
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });
    
    // Hide the ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness  
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await page.waitForTimeout(100);
    
    // Take a full-page screenshot to include the entire UI chrome
    await expect(page).toHaveScreenshot('ending-screen-triumphant.png', { 
      threshold: 0.05
    });
  });

  test('EndingScreen - Tragic ending should render consistently', async ({ page }) => {
    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Mock the narrative ending API to return a tragic ending
    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'The final breach comes at a terrible cost. Your last transmission fades into static as the city mourns a silent guardian.',
            characterLegacy: 'Your name becomes a whispered memory among the resistance—sacrifice etched in the network forever.',
            worldImpact: 'The power vacuum sparks turmoil before a fragile hope emerges from the chaos.',
            tone: 'tragic',
            achievements: ['Last Stand: Protected the weak', 'Unseen Hero: Faded into legend'],
            playTime: 987
          }
        }
      });
    });

    // Navigate to the real play route and run flow
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="game-session-active"]', { timeout: 10000 });
    await page.waitForTimeout(100);
    const endButton = page.getByTestId('game-session-end-story');
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });
    
    // Hide the ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await page.waitForTimeout(100);
    
    // Take a full-page screenshot to include the entire UI chrome
    await expect(page).toHaveScreenshot('ending-screen-tragic.png', { 
      threshold: 0.05
    });
  });

  test('EndingScreen - Mysterious ending should render consistently', async ({ page }) => {
    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Mock the narrative ending API to return a mysterious ending
    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'As the network quiets, a new signal whispers from the shadows. The story ends—or perhaps begins again.',
            characterLegacy: 'Some say you vanished into the code itself; others claim you walk the alleys still.',
            worldImpact: 'Rumors ripple across encrypted forums; a hidden hand guides the city’s fate.',
            tone: 'mysterious',
            achievements: ['Ghost In The Wires', 'Whispers of the Grid'],
            playTime: 456
          }
        }
      });
    });

    // Navigate to the real play route and run flow
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="game-session-active"]', { timeout: 10000 });
    await page.waitForTimeout(100);
    const endButton = page.getByTestId('game-session-end-story');
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });
    
    // Hide the ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness  
    await hideDynamicContent(page);
    // Small settle for style application
    await page.waitForTimeout(150);
    
    // Take a full-page screenshot to include the entire UI chrome
    await expect(page).toHaveScreenshot('ending-screen-mysterious.png', { 
      threshold: 0.05
    });
  });

  test('EndingScreen - Hopeful ending should render consistently', async ({ page }) => {
    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Mock the narrative ending API to return a hopeful ending
    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'With new allies and a free network, the path forward glows brighter than neon.',
            characterLegacy: 'Your actions kindle a movement—open, resilient, unbreakable.',
            worldImpact: 'Community hubs and open protocols flourish; the city dreams again.',
            tone: 'hopeful',
            achievements: ['Beacon of Hope', 'Architect of Freedom'],
            playTime: 321
          }
        }
      });
    });

    // Navigate to the real play route and run flow
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="game-session-active"]', { timeout: 10000 });
    await page.waitForTimeout(100);
    const endButton = page.getByTestId('game-session-end-story');
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });
    
    // Hide the ending image section to prevent variability
    await page.evaluate(() => {
      const imageSection = document.querySelector('[data-testid="ending-screen"] section[aria-label="Story ending illustration"]');
      if (imageSection) {
        (imageSection as HTMLElement).style.display = 'none';
      }
      
      const images = document.querySelectorAll('[data-testid="ending-screen"] img');
      images.forEach(img => {
        (img as HTMLElement).style.display = 'none';
      });
    });
    
    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    await page.waitForTimeout(150);
    
    // Take a full-page screenshot to include the entire UI chrome
    await expect(page).toHaveScreenshot('ending-screen-hopeful.png', { 
      threshold: 0.05
    });
  });
});
