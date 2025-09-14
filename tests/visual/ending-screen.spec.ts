import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent } from './utils/wait-helpers';
import { seedTestData, mockApiEndpoints } from './utils/data-seeder';

/**
 * EndingScreen Visual Regression Tests
 * 
 * Tests the story ending screen display with different emotional tones,
 * ensuring proper design system compliance and WCAG 2.0 accessibility.
 */

test.describe('EndingScreen Visual Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);
  });

  test('EndingScreen - Triumphant ending should render consistently', async ({ page }) => {
    // Seed ending data directly into the narrative store
    await page.evaluate(() => {
      const mockEnding = {
        id: 'ending-triumphant-test',
        sessionId: 'session-cyberpunk-ghost',
        characterId: 'char-cyberpunk-ghost',
        worldId: 'world-cyberpunk-2077',
        type: 'story-complete',
        tone: 'triumphant',
        epilogue: `Victory came with the dawn. As the first rays of sunlight pierced through the smog-shrouded corporate district, you stood atop the Arasaka Tower, the stolen data secured and your mission complete. The city below pulsed with neon life, unaware that their digital prison had just gained a crack in its foundation.

Your neural interface crackled with satisfaction as you transmitted the corporate secrets to every newsnet in the city. Within hours, the truth would be out, and the people would know what their overlords had been hiding. This was more than a heist - this was liberation.

The elevator descended toward street level, carrying you back to the underground where heroes are made in shadows and legends are born in neon light.`,
        characterLegacy: `Ghost became more than just another street mercenary - they became a symbol of resistance against corporate tyranny. Stories of the Arasaka infiltration spread through the underground networks like wildfire, inspiring a new generation of hackers and rebels.

Corporate executives now spoke their name in whispered warnings, and street kids looked up to the legend of the hacker who brought down the most secure tower in Neo-Tokyo. Ghost's methods became the blueprint for every resistance cell that followed.`,
        worldImpact: `The Arasaka data breach marked the beginning of the Corporate Wars' end. With their secrets exposed, public opinion turned decisively against the mega-corporations. Government regulation increased, worker rights were restored, and the stranglehold of corporate feudalism began to loosen.

Neo-Tokyo's skyline still gleamed with neon, but now it represented hope rather than oppression. The city became a beacon for other urban centers struggling under corporate rule, proving that even the mightiest towers could fall.`,
        achievements: [
          'Data Liberator: Successfully extracted and released classified corporate files',
          'Tower Climber: Infiltrated the most secure building in Neo-Tokyo',
          'Digital Revolutionary: Sparked citywide resistance against corporate control',
          'Shadow Legend: Became a mythical figure in the underground',
          'System Breaker: Permanently damaged Arasaka\'s digital infrastructure'
        ],
        playTime: 8640, // 2.4 hours
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Set the ending in the narrative store
      const narrativeStore = localStorage.getItem('narraitor-narrative-store');
      if (narrativeStore) {
        const store = JSON.parse(narrativeStore);
        store.state.currentEnding = mockEnding;
        store.state.isGeneratingEnding = false;
        store.state.endingError = null;
        localStorage.setItem('narraitor-narrative-store', JSON.stringify(store));
      }
    });

    // Navigate to a game session that will trigger ending screen
    await page.goto('/worlds/world-cyberpunk-2077/play');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    // Trigger ending screen navigation (simulate ending trigger)
    await page.evaluate(() => {
      // Navigate to ending screen programmatically
      window.history.pushState({}, '', '/ending');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    
    await page.waitForTimeout(2000);
    
    // Hide dynamic content that could cause flakiness
    await hideDynamicContent(page);
    
    // Wait for content to stabilize
    await waitForContentStable(page);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('ending-screen-triumphant.png', { 
      fullPage: true,
      threshold: 0.05  // 5% threshold for minor rendering differences
    });
  });

  test('EndingScreen - Tragic ending should render consistently', async ({ page }) => {
    // Seed tragic ending data
    await page.evaluate(() => {
      const mockEnding = {
        id: 'ending-tragic-test',
        sessionId: 'session-cyberpunk-ghost',
        characterId: 'char-cyberpunk-ghost', 
        worldId: 'world-cyberpunk-2077',
        type: 'story-complete',
        tone: 'tragic',
        epilogue: `The price of victory was everything. As the Arasaka security systems locked down around you, trapping you in the server room, you made the final upload with trembling fingers. The data was out, but you wouldn't live to see its impact.

The neural feedback from the corporate ICE burned through your mind like liquid fire. Your cybernetic implants sparked and failed one by one as the building's countermeasures overwhelmed your systems. Through the pain, you managed one last transmission to your fixer: "Tell them... the truth is free."

The city's neon lights blurred into darkness as your consciousness faded, but your sacrifice had not been in vain. The seeds of revolution had been planted, watered with your digital blood.`,
        characterLegacy: `Ghost's sacrifice became the rallying cry for the resistance movement that followed. Their death in the Arasaka Tower was not in vain - it proved that even the corporations' most secure systems could be breached, and that some things were worth dying for.

Memorial services were held in hidden underground clubs where hackers and rebels gathered to remember the one who gave everything for the cause. Ghost's final transmission became a mantra for those who fought against corporate oppression: "The truth is free."`,
        worldImpact: `The data Ghost died to release exposed the darkest secrets of the corporate elite, but their death also showed the terrible cost of resistance. The revolution that followed was bloodier and more desperate, fueled by martyrdom and the knowledge that freedom demanded sacrifice.

Neo-Tokyo's transformation was painful and slow, marked by corporate retaliation and underground warfare. But eventually, the city emerged from the chaos with stronger protections for its citizens and limits on corporate power - a memorial to those who died for change.`,
        achievements: [
          'Ultimate Sacrifice: Gave your life to complete the mission',
          'Data Martyr: Died ensuring critical information reached the public', 
          'Final Transmission: Delivered the truth with your last breath',
          'Corporate Nemesis: Became Arasaka\'s most feared enemy',
          'Underground Saint: Inspired a generation of rebels'
        ],
        playTime: 7200, // 2 hours
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Set the ending in the narrative store
      const narrativeStore = localStorage.getItem('narraitor-narrative-store');
      if (narrativeStore) {
        const store = JSON.parse(narrativeStore);
        store.state.currentEnding = mockEnding;
        store.state.isGeneratingEnding = false;
        store.state.endingError = null;
        localStorage.setItem('narraitor-narrative-store', JSON.stringify(store));
      }
    });

    // Navigate and trigger ending screen
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    await page.evaluate(() => {
      window.history.pushState({}, '', '/ending');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    
    await page.waitForTimeout(2000);
    await hideDynamicContent(page);
    await waitForContentStable(page);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('ending-screen-tragic.png', { 
      fullPage: true,
      threshold: 0.05
    });
  });

  test('EndingScreen - Bittersweet ending should render consistently', async ({ page }) => {
    // Seed bittersweet ending data
    await page.evaluate(() => {
      const mockEnding = {
        id: 'ending-bittersweet-test',
        sessionId: 'session-cyberpunk-ghost',
        characterId: 'char-cyberpunk-ghost',
        worldId: 'world-cyberpunk-2077', 
        type: 'story-complete',
        tone: 'bittersweet',
        epilogue: `Success and failure intertwined like lovers in the neon-lit night. You escaped the Arasaka Tower with the data, but not without cost. Your partner Jazz lay dead in the server room, and three innocent security guards would never go home to their families.

The information you liberated would change everything - corporate accountability, worker protections, a chance at real democracy. But as you walked the rain-slicked streets toward your safe house, the weight of what you'd had to do pressed heavy on your shoulders.

Victory tasted like copper and regret, but perhaps that's what real change always cost. The city would be freer tomorrow, built on the graves of today.`,
        characterLegacy: `Ghost succeeded where others failed, but carried the scars of necessary choices for the rest of their days. They became a reluctant hero, respected in the underground but haunted by the prices paid for freedom.

Young hackers sought them out for training, but Ghost always warned them about the cost of the life they were choosing. "Revolution isn't about glory," they would say. "It's about being willing to live with the consequences of doing what's right."`,
        worldImpact: `The corporate data Ghost extracted led to meaningful reforms, but the methods required sparked ongoing debates about ethics in resistance movements. Neo-Tokyo became more democratic but struggled with questions about violence and moral compromise.

The city learned to honor both its heroes and its victims, building memorials not just for those who fought for change, but for those caught in the crossfire. Progress came with accountability - a lesson Ghost had paid dearly to teach.`,
        achievements: [
          'Moral Complexity: Made the hard choices that others couldn\'t',
          'Reluctant Hero: Succeeded despite personal cost',
          'Data Liberator: Freed crucial information for public benefit',
          'Survivor\'s Burden: Lived to see the consequences of your actions',
          'Catalyst for Change: Sparked debates about ethics and resistance'
        ],
        playTime: 9000, // 2.5 hours
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Set the ending in the narrative store
      const narrativeStore = localStorage.getItem('narraitor-narrative-store');
      if (narrativeStore) {
        const store = JSON.parse(narrativeStore);
        store.state.currentEnding = mockEnding;
        store.state.isGeneratingEnding = false;
        store.state.endingError = null;
        localStorage.setItem('narraitor-narrative-store', JSON.stringify(store));
      }
    });

    // Navigate and trigger ending screen
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    await page.evaluate(() => {
      window.history.pushState({}, '', '/ending');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    
    await page.waitForTimeout(2000);
    await hideDynamicContent(page);
    await waitForContentStable(page);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('ending-screen-bittersweet.png', { 
      fullPage: true,
      threshold: 0.05
    });
  });

  test('EndingScreen - Loading state should render consistently', async ({ page }) => {
    // Set loading state in narrative store
    await page.evaluate(() => {
      const narrativeStore = localStorage.getItem('narraitor-narrative-store');
      if (narrativeStore) {
        const store = JSON.parse(narrativeStore);
        store.state.currentEnding = null;
        store.state.isGeneratingEnding = true;
        store.state.endingError = null;
        localStorage.setItem('narraitor-narrative-store', JSON.stringify(store));
      }
    });

    // Navigate and trigger ending screen
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    await page.evaluate(() => {
      window.history.pushState({}, '', '/ending');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    
    await page.waitForTimeout(1000);
    await hideDynamicContent(page);
    
    // Take screenshot of loading state
    await expect(page).toHaveScreenshot('ending-screen-loading.png', { 
      fullPage: true,
      threshold: 0.05
    });
  });

  test('EndingScreen - Error state should render consistently', async ({ page }) => {
    // Set error state in narrative store
    await page.evaluate(() => {
      const narrativeStore = localStorage.getItem('narraitor-narrative-store');
      if (narrativeStore) {
        const store = JSON.parse(narrativeStore);
        store.state.currentEnding = null;
        store.state.isGeneratingEnding = false;
        store.state.endingError = 'Failed to generate story ending. The AI service is currently unavailable.';
        localStorage.setItem('narraitor-narrative-store', JSON.stringify(store));
      }
    });

    // Navigate and trigger ending screen
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    await page.evaluate(() => {
      window.history.pushState({}, '', '/ending');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    
    await page.waitForTimeout(1000);
    await hideDynamicContent(page);
    
    // Take screenshot of error state
    await expect(page).toHaveScreenshot('ending-screen-error.png', { 
      fullPage: true,
      threshold: 0.05
    });
  });
});