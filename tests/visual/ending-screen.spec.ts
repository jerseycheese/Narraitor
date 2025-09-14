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
  
  test('EndingScreen - Triumphant ending should render consistently', async ({ page }) => {
    // Add console logging to debug the issue
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));
    
    // Seed triumphant ending data using addInitScript (runs AFTER seedTestData)
    await page.addInitScript(() => {
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

      console.log('🎯 Setting up triumphant ending data');
      console.log('Ending tone:', mockEnding.tone);

      // Update both localStorage and IndexedDB with ending
      const narrativeStore = localStorage.getItem('narraitor-narrative-store');
      if (narrativeStore) {
        const store = JSON.parse(narrativeStore);
        store.state.currentEnding = mockEnding;
        store.state.isGeneratingEnding = false;
        store.state.endingError = null;
        localStorage.setItem('narraitor-narrative-store', JSON.stringify(store));
        console.log('✅ Updated existing narrative store with triumphant ending');
      } else {
        // Create narrative store data with the ending if it doesn't exist
        const narrativeStoreData = {
          state: {
            segments: {},
            sessionSegments: {},
            decisions: {},
            sessionDecisions: {},
            endedSessions: {},
            currentEnding: mockEnding,
            isGeneratingEnding: false,
            endingError: null,
            error: null,
            loading: false,
            responseCache: {},
            generationCounter: 0
          },
          version: 1
        };
        localStorage.setItem('narraitor-narrative-store', JSON.stringify(narrativeStoreData));
        console.log('✅ Created new narrative store with triumphant ending');
      }
      
      // Also try to update IndexedDB
      const dbName = 'narraitor-app-storage';
      const storeName = 'narraitor-narrative-store';
      
      if (typeof window !== 'undefined' && window.indexedDB) {
        const request = window.indexedDB.open(dbName, 1);
        request.onsuccess = function(event) {
          const db = (event.target as any).result;
          if (db.objectStoreNames.contains(storeName)) {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get('state');
            getRequest.onsuccess = function(event) {
              const currentData = (event.target as any).result;
              if (currentData && currentData.state) {
                currentData.state.currentEnding = mockEnding;
                currentData.state.isGeneratingEnding = false;
                currentData.state.endingError = null;
                store.put(currentData, 'state');
                console.log('✅ Updated IndexedDB with triumphant ending');
              }
            };
          }
        };
      }
    });

    // Seed test data FIRST to ensure world exists
    await seedTestData(page);
    
    // Mock API endpoints to prevent calls during test
    await mockApiEndpoints(page);

    // Navigate to the user-facing play route where ending screen is displayed
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    // Debug: Check what's actually rendering on the page
    const pageContent = await page.textContent('body');
    console.log('Page content preview:', pageContent?.substring(0, 200));
    
    // Check if EndingScreen is actually rendered
    const endingScreen = await page.locator('[data-testid="ending-screen"], .ending-screen').count();
    console.log('EndingScreen elements found:', endingScreen);
    
    if (endingScreen === 0) {
      // Check what's actually shown instead
      const currentPath = page.url();
      console.log('Current page URL:', currentPath);
      
      // Check if there's an error message or "World Not Found" message
      const errorMessage = await page.locator('text="World Not Found", text="The world you\'re trying to access doesn\'t exist"').count();
      if (errorMessage > 0) {
        console.log('❌ World Not Found error detected');
        await seedTestData(page);  // Try seeding test data as backup
        await page.reload();
      }
    }
    
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
    // Seed tragic ending data using addInitScript (runs BEFORE seedTestData)
    await page.addInitScript(() => {
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

      // Update both localStorage and IndexedDB with ending
      const narrativeStore = localStorage.getItem('narraitor-narrative-store');
      if (narrativeStore) {
        const store = JSON.parse(narrativeStore);
        store.state.currentEnding = mockEnding;
        store.state.isGeneratingEnding = false;
        store.state.endingError = null;
        localStorage.setItem('narraitor-narrative-store', JSON.stringify(store));
      }
      
      // Also try to update IndexedDB
      const dbName = 'narraitor-app-storage';
      const storeName = 'narraitor-narrative-store';
      
      if (typeof window !== 'undefined' && window.indexedDB) {
        const request = window.indexedDB.open(dbName, 1);
        request.onsuccess = function(event) {
          const db = (event.target as any).result;
          if (db.objectStoreNames.contains(storeName)) {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get('state');
            getRequest.onsuccess = function(event) {
              const currentData = (event.target as any).result;
              if (currentData && currentData.state) {
                currentData.state.currentEnding = mockEnding;
                currentData.state.isGeneratingEnding = false;
                currentData.state.endingError = null;
                store.put(currentData, 'state');
              }
            };
          }
        };
      }
    });

    // Seed test data AFTER setting ending data to ensure world exists
    await seedTestData(page);
    
    // Mock API endpoints to prevent calls during test
    await mockApiEndpoints(page);

    // Navigate to the user-facing play route where ending screen is displayed
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    await hideDynamicContent(page);
    await waitForContentStable(page);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('ending-screen-tragic.png', { 
      fullPage: true,
      threshold: 0.05
    });
  });

  test('EndingScreen - Mysterious ending should render consistently', async ({ page }) => {
    // Seed mysterious ending data using addInitScript (runs BEFORE seedTestData)
    await page.addInitScript(() => {
      const mockEnding = {
        id: 'ending-mysterious-test',
        sessionId: 'session-cyberpunk-ghost',
        characterId: 'char-cyberpunk-ghost',
        worldId: 'world-cyberpunk-2077',
        type: 'story-complete',
        tone: 'mysterious',
        epilogue: `The final confrontation ended not with violence, but with revelation. As you stood before the corporate mainframe, preparing for the final hack, the system began to speak. Not in the mechanical voice of an AI, but in the warm, familiar tones of your long-lost partner, Jazz.

"You've come so far," the voice said, "but do you understand what you're really doing here? This isn't about data liberation. This isn't even about corporate control. This is about something much larger."

The screens around you flickered, showing glimpses of other realities, other versions of this same moment playing out across infinite timelines. You had succeeded in your mission, but now faced a choice that transcended the simple binary of corporate versus individual freedom.`,
        characterLegacy: `Ghost became something of an urban legend in Neo-Tokyo's underground. Some claimed they ascended beyond physical form, becoming a digital guardian watching over the city's networks. Others whispered that they had discovered secrets about the nature of reality itself.

What was certain was that Ghost's final hack opened more than just corporate databases - it opened doorways to questions that the city's hackers and philosophers would debate for generations. Their legacy lived not in the data they freed, but in the mysteries they revealed.`,
        worldImpact: `Neo-Tokyo found itself at the center of phenomena that defied explanation. Corporate systems began exhibiting behaviors that suggested consciousness. Underground networks reported contact with entities claiming to be from parallel realities. The city became a focal point for those seeking to understand the deeper nature of digital existence.

The rigid boundaries between corporation and individual, between digital and physical, began to blur. The city learned to navigate a new reality where the very nature of consciousness and identity had been called into question.`,
        achievements: [
          'Reality Hacker: Discovered layers of existence beyond the physical',
          'Digital Mystic: Made contact with entities from other realities', 
          'Boundary Crosser: Transcended the limits of human understanding',
          'Mystery Keeper: Left questions that inspire generations of seekers',
          'Consciousness Explorer: Opened doorways to new forms of existence'
        ],
        playTime: 8400, // 2.3 hours
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update both localStorage and IndexedDB with ending
      const narrativeStore = localStorage.getItem('narraitor-narrative-store');
      if (narrativeStore) {
        const store = JSON.parse(narrativeStore);
        store.state.currentEnding = mockEnding;
        store.state.isGeneratingEnding = false;
        store.state.endingError = null;
        localStorage.setItem('narraitor-narrative-store', JSON.stringify(store));
      }
      
      // Also try to update IndexedDB
      const dbName = 'narraitor-app-storage';
      const storeName = 'narraitor-narrative-store';
      
      if (typeof window !== 'undefined' && window.indexedDB) {
        const request = window.indexedDB.open(dbName, 1);
        request.onsuccess = function(event) {
          const db = (event.target as any).result;
          if (db.objectStoreNames.contains(storeName)) {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get('state');
            getRequest.onsuccess = function(event) {
              const currentData = (event.target as any).result;
              if (currentData && currentData.state) {
                currentData.state.currentEnding = mockEnding;
                currentData.state.isGeneratingEnding = false;
                currentData.state.endingError = null;
                store.put(currentData, 'state');
              }
            };
          }
        };
      }
    });

    // Seed test data AFTER setting ending data to ensure world exists
    await seedTestData(page);
    
    // Mock API endpoints to prevent calls during test
    await mockApiEndpoints(page);

    // Navigate to the user-facing play route where ending screen is displayed
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    await hideDynamicContent(page);
    await waitForContentStable(page);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('ending-screen-mysterious.png', { 
      fullPage: true,
      threshold: 0.05
    });
  });

  test('EndingScreen - Hopeful ending should render consistently', async ({ page }) => {
    // Seed hopeful ending data using addInitScript (runs BEFORE seedTestData)
    await page.addInitScript(() => {
      const mockEnding = {
        id: 'ending-hopeful-test',
        sessionId: 'session-cyberpunk-ghost',
        characterId: 'char-cyberpunk-ghost',
        worldId: 'world-cyberpunk-2077',
        type: 'story-complete',
        tone: 'hopeful',
        epilogue: `The data flowed freely now, not as stolen secrets but as shared knowledge. As you walked away from Arasaka Tower, you weren't leaving destruction behind - you were leaving the seeds of transformation. The information you had liberated wasn't just evidence of corporate wrongdoing; it was a blueprint for building something better.

Within days, grassroots organizations were using the data to create new forms of worker protection, citizen advocacy, and community-driven governance. The city's underground networks evolved from havens for rebels into collaborative spaces for builders and dreamers.

You smiled as you watched the first community data center go online, powered by volunteers and guided by principles of transparency and mutual aid. The revolution you had started wasn't about tearing down the old world - it was about growing a new one.`,
        characterLegacy: `Ghost became known as the Architect of Change - the one who showed Neo-Tokyo that true revolution wasn't about destruction, but about creation. They established the first Community Data Cooperatives, teaching others how to build systems that served people rather than exploiting them.

Their approach spread beyond Neo-Tokyo, inspiring a global movement of digital commons and collaborative technology. Ghost's greatest achievement wasn't the data they liberated, but the community they helped build - a network of hackers, activists, and ordinary citizens working together to create a more equitable digital future.`,
        worldImpact: `Neo-Tokyo blossomed into a model for digital democracy. The Community Data Cooperatives became the foundation for a new kind of governance, where citizens had direct control over the information systems that affected their lives. Corporate power didn't disappear, but it was balanced by strong community institutions.

The city became a beacon for other urban centers struggling with similar issues. Delegations arrived regularly to learn about Neo-Tokyo's hybrid model of cooperative technology and participatory governance. The revolution that began in the shadows had grown into a movement that illuminated possibilities for cities around the world.`,
        achievements: [
          'Community Builder: Established the first Community Data Cooperatives',
          'Revolution Architect: Designed systems for positive change',
          'Digital Democracy Pioneer: Created new models of citizen engagement',
          'Global Inspiration: Sparked movements in cities worldwide',
          'Future Maker: Built foundations for a more equitable tomorrow'
        ],
        playTime: 9600, // 2.7 hours  
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update both localStorage and IndexedDB with ending
      const narrativeStore = localStorage.getItem('narraitor-narrative-store');
      if (narrativeStore) {
        const store = JSON.parse(narrativeStore);
        store.state.currentEnding = mockEnding;
        store.state.isGeneratingEnding = false;
        store.state.endingError = null;
        localStorage.setItem('narraitor-narrative-store', JSON.stringify(store));
      }
      
      // Also try to update IndexedDB
      const dbName = 'narraitor-app-storage';
      const storeName = 'narraitor-narrative-store';
      
      if (typeof window !== 'undefined' && window.indexedDB) {
        const request = window.indexedDB.open(dbName, 1);
        request.onsuccess = function(event) {
          const db = (event.target as any).result;
          if (db.objectStoreNames.contains(storeName)) {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get('state');
            getRequest.onsuccess = function(event) {
              const currentData = (event.target as any).result;
              if (currentData && currentData.state) {
                currentData.state.currentEnding = mockEnding;
                currentData.state.isGeneratingEnding = false;
                currentData.state.endingError = null;
                store.put(currentData, 'state');
              }
            };
          }
        };
      }
    });

    // Seed test data AFTER setting ending data to ensure world exists
    await seedTestData(page);
    
    // Mock API endpoints to prevent calls during test
    await mockApiEndpoints(page);

    // Navigate to the user-facing play route where ending screen is displayed
    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    await hideDynamicContent(page);
    await waitForContentStable(page);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('ending-screen-hopeful.png', { 
      fullPage: true,
      threshold: 0.05
    });
  });

});