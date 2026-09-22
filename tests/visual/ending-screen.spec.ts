import { test, expect, type Page } from '@playwright/test';
import { hideDynamicContent, expandAllCollapsibleSections, waitForContentStable } from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

/**
 * EndingScreen Visual Regression Tests
 * 
 * Tests the story ending screen display with different emotional tones using the actual user flow.
 * Follows Playwright best practices by testing the real user journey.
 *
 * DS coverage (#1264): this spec covers the four emotional tones (content variants)
 * in a single theme. The ending screen surface across DS1/DS2/DS3 is covered by
 * tests/visual/ending-screen-themes.spec.ts.
 */

const MOCK_ENDING_IMAGE = '/visual-assets/world-cyberpunk.png';

test.describe('EndingScreen Visual Tests', () => {
  test.describe.configure({ timeout: 60000 });
  const ACTIVE_SESSION_SELECTOR = '[data-testid="manuscript-session-shell"]';
  const ACTIVE_SESSION_TIMEOUT = 20000;

  const waitForActiveSession = async (page: Page): Promise<void> => {
    await waitForContentStable(page);
    await page.waitForSelector(ACTIVE_SESSION_SELECTOR, { timeout: ACTIVE_SESSION_TIMEOUT });
  };

  const seedCheckpointsForSession = async (page: Page): Promise<void> => {
    await page.evaluate(() => {
      interface WindowWithStores {
        useWorldStore?: {
          getState?: () => {
            updateWorldState?: (
              worldId: string,
              update: Record<string, unknown>,
              sessionId: string
            ) => void;
            currentWorldId?: string | null;
          };
        };
        useSessionStore?: {
          getState?: () => {
            worldId?: string | null;
            id?: string | null;
            characterId?: string | null;
          };
        };
      }
      const appWindow = window as unknown as WindowWithStores;

      const worldStore = appWindow.useWorldStore?.getState?.();
      const sessionStore = appWindow.useSessionStore?.getState?.();

      if (!worldStore?.updateWorldState || !sessionStore) {
        throw new Error('Stores not available on window');
      }

      const worldId =
        sessionStore.worldId ||
        worldStore.currentWorldId ||
        'world-cyberpunk-2077';
      const sessionId =
        sessionStore.id ||
        'session-visual-story';
      const characterId =
        sessionStore.characterId ||
        'character-cyberpunk-merc';

      const storyCheckpoints = [
        {
          id: 'checkpoint-story-1',
          sessionId,
          characterId,
          createdAt: '2025-11-24T09:00:00Z',
          segment:
            'Nova Ghost Chen slipped past perimeter security in the Neon District, jacked into the corporate subnet, and extracted the encrypted schematics before patrol drones could triangulate the breach.',
          highlights: ['Neon District infiltration', 'Subnet schematics extracted'],
          eventIds: ['visual-event-1'],
        },
        {
          id: 'checkpoint-story-2',
          sessionId,
          characterId,
          createdAt: '2025-11-24T09:15:00Z',
          segment:
            'At the Kabuki underground rendezvous, Syndicate enforcers ambushed the drop site. A fierce shootout forced an escape through the flooded storm drains into the lower wards.',
          highlights: ['Kabuki drop ambush', 'Storm drain escape'],
          eventIds: ['visual-event-2'],
        },
        {
          id: 'checkpoint-story-3',
          sessionId,
          characterId,
          createdAt: '2025-11-24T09:30:00Z',
          segment:
            'Safely inside the runner bunker, deciphered the stolen core data to reveal a clandestine backdoor embedded in Neo-Tokyo public grid infrastructure.',
          highlights: ['Core data decrypted', 'Public grid backdoor uncovered'],
          eventIds: ['visual-event-3'],
        },
        {
          id: 'checkpoint-story-4',
          sessionId,
          characterId,
          createdAt: '2025-11-24T09:45:00Z',
          segment:
            'United the splintered cybernetic resistance factions across three districts, coordinating an all-out assault against the Arasaka central transmitter.',
          highlights: ['Resistance unified', 'Central transmitter assault'],
          eventIds: ['visual-event-4'],
        },
        {
          id: 'checkpoint-story-5',
          sessionId,
          characterId,
          createdAt: '2025-11-24T10:00:00Z',
          segment:
            'In the heart of the tower reactor chamber, severed the rogue AI control protocol and broadcast universal bypass keys to every terminal in the city.',
          highlights: ['Rogue AI severed', 'Citywide bypass broadcast'],
          eventIds: ['visual-event-5'],
        },
      ];

      worldStore.updateWorldState(worldId, { storyCheckpoints }, sessionId);
    });
  };
  
  test('EndingScreen - Triumphant ending should render consistently', async ({ page }) => {
    // Set viewport size to ensure desktop layout (Hero actions visible)
    await page.setViewportSize({ width: 1280, height: 720 });

    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Mock the image generation API to return a consistent test image
    await page.route('**/api/generate-ending-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          imageUrl: MOCK_ENDING_IMAGE,
        },
      });
    });

    // Mock the narrative ending API to return a triumphant ending
    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'With the city liberated and the syndicate dismantled, Nova watches community relays bloom across Neo-Tokyo. The skyline still bears the scars of the blackout, but each repaired district sends its own signal into the rain, proof that the city can speak for itself again.',
            characterLegacy: 'Nova Ghost Chen becomes a symbol of resistance, teaching new crews how to protect one another before they learn how to break a system.',
            worldImpact: 'Corporate overreach is pushed back as neighborhood networks take control of essential data, mutual-aid channels, and the stories that once vanished behind paywalls.',
            tone: 'triumphant',
            achievements: ['Master Hacker: Outsmarted corporate AI', 'City Savior: Freed Neo-Tokyo'],
            playTime: 1234,
          },
        },
      });
    });

    // Navigate to the real play route
    await page.goto('/worlds/world-cyberpunk-2077/play');
    // Wait for active session UI
    await waitForActiveSession(page);

    // Trigger End Story button from Hero actions (now in top right)
    await page.waitForTimeout(100);
    const endButton = page.getByRole('button', { name: 'End Story' });
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });

    // Assert fallback state: placeholder button is visible, hero image is not rendered
    await expect(page.getByRole('button', { name: 'Generate ending image' })).toBeVisible();
    await expect(page.locator('.component-ending-screen-hero-image')).not.toBeVisible();

    // Give extra time for rendering settle
    await page.waitForTimeout(1000);

    // Expand all collapsible sections including "Your Story"
    await expandAllCollapsibleSections(page);

    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await page.waitForTimeout(100);
    
    // Take a full-page screenshot to include the entire UI chrome
    await expect(page).toHaveScreenshot('ending-screen-triumphant.png', {
      threshold: 0.05,
      fullPage: true,
    });
  });

  test('EndingScreen - Tragic ending should render consistently', async ({ page }) => {
    // Set viewport size to ensure desktop layout (Hero actions visible)
    await page.setViewportSize({ width: 1280, height: 720 });

    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Mock the image generation API to return a consistent test image
    await page.route('**/api/generate-ending-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          imageUrl: MOCK_ENDING_IMAGE,
        },
      });
    });

    // Mock the narrative ending API to return a tragic ending
    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'The final breach closes only after Nova burns every route home. Her last transmission dissolves into static while rain carries the glow of emergency beacons through the district, and the people she protected begin the harder work of surviving without her.',
            characterLegacy: 'Her name becomes a whispered memory among the resistance, a reminder that sacrifice is not a strategy but sometimes the cost of leaving a door open for others.',
            worldImpact: 'The power vacuum sparks turf wars and uncertainty, yet the encrypted tools Nova left behind give scattered communities a fragile way to coordinate before the corporations return.',
            tone: 'tragic',
            achievements: ['Last Stand: Protected the weak', 'Unseen Hero: Faded into legend'],
            playTime: 987,
          },
        },
      });
    });

    // Navigate to the real play route and run flow
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await waitForActiveSession(page);
    await page.waitForTimeout(100);
    const endButton = page.getByRole('button', { name: 'End Story' });
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });

    // Assert fallback state: placeholder button is visible, hero image is not rendered
    await expect(page.getByRole('button', { name: 'Generate ending image' })).toBeVisible();
    await expect(page.locator('.component-ending-screen-hero-image')).not.toBeVisible();

    await page.waitForTimeout(1000);

    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    
    // Take a full-page screenshot to include the entire UI chrome
    await expect(page).toHaveScreenshot('ending-screen-tragic.png', {
      threshold: 0.05,
      fullPage: true,
    });
  });

  test('EndingScreen - Mysterious ending should render consistently', async ({ page }) => {
    // Set viewport size to ensure desktop layout (Hero actions visible)
    await page.setViewportSize({ width: 1280, height: 720 });

    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Mock the image generation API to return a consistent test image
    await page.route('**/api/generate-ending-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          imageUrl: MOCK_ENDING_IMAGE,
        },
      });
    });

    // Mock the narrative ending API to return a mysterious ending
    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'As the network quiets, one unlisted relay begins repeating a phrase only Nova’s first crew would recognize. The story closes on an empty alley and a reflected silhouette in a shop window, leaving no proof of whether she escaped or became part of the signal itself.',
            characterLegacy: 'Some say Nova vanished into the code; others swear they still see her walking the alleys before a corporate raid, always gone before anyone can say thank you.',
            worldImpact: 'Rumors ripple through encrypted forums and abandoned switchboards, suggesting a hidden hand is redirecting danger away from the city’s most vulnerable residents.',
            tone: 'mysterious',
            achievements: ['Ghost In The Wires', 'Whispers of the Grid'],
            playTime: 456,
          },
        },
      });
    });

    // Navigate to the real play route and run flow
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await waitForActiveSession(page);
    await page.waitForTimeout(100);
    const endButton = page.getByRole('button', { name: 'End Story' });
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });

    // Assert fallback state: placeholder button is visible, hero image is not rendered
    await expect(page.getByRole('button', { name: 'Generate ending image' })).toBeVisible();
    await expect(page.locator('.component-ending-screen-hero-image')).not.toBeVisible();

    await page.waitForTimeout(1000);

    // Expand all collapsible sections including "Your Story"
    await expandAllCollapsibleSections(page);

    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    await page.waitForTimeout(150);
    
    // Take a full-page screenshot to include the entire UI chrome
    await expect(page).toHaveScreenshot('ending-screen-mysterious.png', {
      threshold: 0.05,
      fullPage: true,
    });
  });

  test('EndingScreen - Hopeful ending should render consistently', async ({ page }) => {
    // Set viewport size to ensure desktop layout (Hero actions visible)
    await page.setViewportSize({ width: 1280, height: 720 });

    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Mock the image generation API to return a consistent test image
    await page.route('**/api/generate-ending-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          imageUrl: MOCK_ENDING_IMAGE,
        },
      });
    });

    // Mock the narrative ending API to return a hopeful ending
    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'With new allies guarding a free network, Nova steps onto a rooftop as the first public broadcast rolls across Neo-Tokyo. It is not a promise that every danger has passed, only an invitation for people who have been isolated for too long to find one another in the open.',
            characterLegacy: 'Her actions kindle a movement that is open, resilient, and patient enough to outlast the next executive who believes the city can be owned.',
            worldImpact: 'Community hubs, repair collectives, and open protocols flourish across the districts, giving residents practical reasons to believe the city can dream again.',
            tone: 'hopeful',
            achievements: ['Beacon of Hope', 'Architect of Freedom'],
            playTime: 321,
          },
        },
      });
    });

    // Navigate to the real play route and run flow
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await waitForActiveSession(page);
    await page.waitForTimeout(100);
    const endButton = page.getByRole('button', { name: 'End Story' });
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });

    // Assert fallback state: placeholder button is visible, hero image is not rendered
    await expect(page.getByRole('button', { name: 'Generate ending image' })).toBeVisible();
    await expect(page.locator('.component-ending-screen-hero-image')).not.toBeVisible();

    await page.waitForTimeout(1000);

    // Expand all collapsible sections including "Your Story"
    await expandAllCollapsibleSections(page);

    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);

    await page.waitForTimeout(100);

    // Take a full-page screenshot to include the entire UI chrome
    await expect(page).toHaveScreenshot('ending-screen-hopeful.png', {
      threshold: 0.05,
      fullPage: true,
    });
  });

  test('EndingScreen - Triumphant ending should render consistently (dark mode)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.addInitScript(() => {
      window.localStorage.setItem('narraitor-color-scheme', 'dark');
    });

    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.route('**/api/generate-ending-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          imageUrl: MOCK_ENDING_IMAGE,
        },
      });
    });

    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'With the city liberated and the syndicate dismantled, Nova watches community relays bloom across Neo-Tokyo. The skyline still bears the scars of the blackout, but each repaired district sends its own signal into the rain, proof that the city can speak for itself again.',
            characterLegacy: 'Nova Ghost Chen becomes a symbol of resistance, teaching new crews how to protect one another before they learn how to break a system.',
            worldImpact: 'Corporate overreach is pushed back as neighborhood networks take control of essential data, mutual-aid channels, and the stories that once vanished behind paywalls.',
            tone: 'triumphant',
            achievements: ['Master Hacker: Outsmarted corporate AI', 'City Savior: Freed Neo-Tokyo'],
            playTime: 1234,
          },
        },
      });
    });

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await waitForActiveSession(page);
    await page.waitForTimeout(100);
    const endButton = page.getByRole('button', { name: 'End Story' });
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });

    // Assert fallback state: placeholder button is visible, hero image is not rendered
    await expect(page.getByRole('button', { name: 'Generate ending image' })).toBeVisible();
    await expect(page.locator('.component-ending-screen-hero-image')).not.toBeVisible();

    await page.waitForTimeout(1000);

    await expandAllCollapsibleSections(page);
    await hideDynamicContent(page);
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('ending-screen-dark.png', {
      threshold: 0.05,
      fullPage: true,
    });
  });

  test('EndingScreen - Triumphant ending should render consistently (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.route('**/api/generate-ending-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          imageUrl: MOCK_ENDING_IMAGE,
        },
      });
    });

    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'With the city liberated and the syndicate dismantled, Nova watches community relays bloom across Neo-Tokyo. The skyline still bears the scars of the blackout, but each repaired district sends its own signal into the rain, proof that the city can speak for itself again.',
            characterLegacy: 'Nova Ghost Chen becomes a symbol of resistance, teaching new crews how to protect one another before they learn how to break a system.',
            worldImpact: 'Corporate overreach is pushed back as neighborhood networks take control of essential data, mutual-aid channels, and the stories that once vanished behind paywalls.',
            tone: 'triumphant',
            achievements: ['Master Hacker: Outsmarted corporate AI', 'City Savior: Freed Neo-Tokyo'],
            playTime: 1234,
          },
        },
      });
    });

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await waitForActiveSession(page);
    await page.waitForTimeout(100);
    const endButton = page.getByRole('button', { name: 'End Story' });
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });

    // Assert fallback state: placeholder button is visible, hero image is not rendered
    await expect(page.getByRole('button', { name: 'Generate ending image' })).toBeVisible();
    await expect(page.locator('.component-ending-screen-hero-image')).not.toBeVisible();

    await page.waitForTimeout(1000);

    await expandAllCollapsibleSections(page);
    await hideDynamicContent(page);
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('ending-screen-mobile.png', {
      threshold: 0.05,
      fullPage: true,
    });
  });

  test('EndingScreen - with image should render consistently', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.route('**/api/generate-ending-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          imageUrl: MOCK_ENDING_IMAGE,
        },
      });
    });

    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'With the city liberated and the syndicate dismantled, Nova watches community relays bloom across Neo-Tokyo. The skyline still bears the scars of the blackout, but each repaired district sends its own signal into the rain, proof that the city can speak for itself again.',
            characterLegacy: 'Nova Ghost Chen becomes a symbol of resistance, teaching new crews how to protect one another before they learn how to break a system.',
            worldImpact: 'Corporate overreach is pushed back as neighborhood networks take control of essential data, mutual-aid channels, and the stories that once vanished behind paywalls.',
            tone: 'triumphant',
            achievements: ['Master Hacker: Outsmarted corporate AI', 'City Savior: Freed Neo-Tokyo'],
            playTime: 1234,
          },
        },
      });
    });

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await waitForActiveSession(page);

    await page.waitForTimeout(100);
    const endButton = page.getByRole('button', { name: 'End Story' });
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });

    // Trigger image generation and verify hero image renders
    const generateButton = page.getByRole('button', { name: 'Generate ending image' });
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    await expect(page.locator('.component-ending-screen-hero-image')).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(1000);
    await expandAllCollapsibleSections(page);
    await hideDynamicContent(page);
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('ending-screen-with-image.png', {
      threshold: 0.05,
      fullPage: true,
    });
  });

  test('EndingScreen - with image should render consistently (dark mode)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.addInitScript(() => {
      window.localStorage.setItem('narraitor-color-scheme', 'dark');
    });

    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.route('**/api/generate-ending-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          imageUrl: MOCK_ENDING_IMAGE,
        },
      });
    });

    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue: 'With the city liberated and the syndicate dismantled, Nova watches community relays bloom across Neo-Tokyo. The skyline still bears the scars of the blackout, but each repaired district sends its own signal into the rain, proof that the city can speak for itself again.',
            characterLegacy: 'Nova Ghost Chen becomes a symbol of resistance, teaching new crews how to protect one another before they learn how to break a system.',
            worldImpact: 'Corporate overreach is pushed back as neighborhood networks take control of essential data, mutual-aid channels, and the stories that once vanished behind paywalls.',
            tone: 'triumphant',
            achievements: ['Master Hacker: Outsmarted corporate AI', 'City Savior: Freed Neo-Tokyo'],
            playTime: 1234,
          },
        },
      });
    });

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await waitForActiveSession(page);

    await page.waitForTimeout(100);
    const endButton = page.getByRole('button', { name: 'End Story' });
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });

    // Trigger image generation and verify hero image renders
    const generateButton = page.getByRole('button', { name: 'Generate ending image' });
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    await expect(page.locator('.component-ending-screen-hero-image')).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(1000);
    await expandAllCollapsibleSections(page);
    await hideDynamicContent(page);
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('ending-screen-with-image-dark.png', {
      threshold: 0.05,
      fullPage: true,
    });
  });

  test('EndingScreen - Your Story expanded should render consistently', async ({ page }) => {
    // Set viewport size to ensure desktop layout (Hero actions visible)
    await page.setViewportSize({ width: 1280, height: 720 });

    // Seed normal test data
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Mock the image generation API to return a consistent test image
    await page.route('**/api/generate-ending-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          imageUrl: MOCK_ENDING_IMAGE,
        },
      });
    });

    // Mock the narrative ending API to return a triumphant ending
    await page.route('**/api/narrative/ending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: {
            epilogue:
              'With the city liberated and the syndicate dismantled, Nova watches community relays bloom across Neo-Tokyo. The skyline still bears the scars of the blackout, but each repaired district sends its own signal into the rain, proof that the city can speak for itself again.',
            characterLegacy:
              'Nova Ghost Chen becomes a symbol of resistance, teaching new crews how to protect one another before they learn how to break a system.',
            worldImpact:
              'Corporate overreach is pushed back as neighborhood networks take control of essential data, mutual-aid channels, and the stories that once vanished behind paywalls.',
            tone: 'triumphant',
            achievements: [
              'Master Hacker: Outsmarted corporate AI',
              'City Savior: Freed Neo-Tokyo',
            ],
            playTime: 1234,
          },
        },
      });
    });

    // Navigate to the real play route
    await page.goto('/worlds/world-cyberpunk-2077/play');
    // Wait for active session UI
    await waitForActiveSession(page);

    // Seed 5 checkpoints into the session so "Your Story" has multiple paragraphs to render
    await seedCheckpointsForSession(page);

    // Trigger End Story button from Hero actions
    await page.waitForTimeout(100);
    const endButton = page.getByRole('button', { name: 'End Story' });
    await endButton.scrollIntoViewIfNeeded();
    await expect(endButton).toBeVisible();
    await expect(endButton).toBeEnabled();
    await endButton.click();
    await page.waitForSelector('[role="dialog"]:has-text("End Story")', { timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("End Story")').click();

    // Wait for the ending screen to render
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 });

    // Assert fallback hero state
    await expect(page.getByRole('button', { name: 'Generate ending image' })).toBeVisible();
    await expect(page.locator('.component-ending-screen-hero-image')).not.toBeVisible();

    // Click to expand the "Your Story" section
    const yourStoryButton = page.getByRole('button', { name: /Your Story/i }).first();
    await expect(yourStoryButton).toBeVisible();
    await yourStoryButton.click();

    // Expand all collapsible sections
    await expandAllCollapsibleSections(page);

    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);

    // Wait for content to stabilize
    await page.waitForTimeout(100);

    // Take a full-page screenshot to include the entire UI chrome
    await expect(page).toHaveScreenshot('ending-screen-your-story-expanded.png', {
      threshold: 0.05,
      fullPage: true,
    });
  });
});
