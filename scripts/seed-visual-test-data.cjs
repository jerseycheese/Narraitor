#!/usr/bin/env node

/**
 * Seed Visual Test Data Script
 * 
 * This script populates the app with consistent test data for visual regression tests.
 * It directly manipulates localStorage to avoid AI generation variability.
 */

const { chromium } = require('playwright');

// Consistent test data (no AI generation - same every time)
const TEST_WORLDS = [
  {
    id: 'world-test-cyberpunk',
    name: 'Neo-Tokyo 2087',
    description: 'A sprawling cyberpunk metropolis where corporate towers pierce the smog-filled sky and neon lights reflect off rain-soaked streets.',
    genre: 'Cyberpunk',
    attributes: [
      {
        id: 'attr-tech-level',
        name: 'Tech Level',
        type: 'number',
        description: 'Your familiarity with advanced technology and cybernetic implants',
        defaultValue: 5,
        minValue: 1,
        maxValue: 10,
        worldId: 'world-test-cyberpunk'
      },
      {
        id: 'attr-street-cred',
        name: 'Street Cred',
        type: 'number', 
        description: 'Your reputation and connections in the urban underground',
        defaultValue: 3,
        minValue: 1,
        maxValue: 10,
        worldId: 'world-test-cyberpunk'
      }
    ],
    skills: [
      {
        id: 'skill-hacking',
        name: 'Hacking',
        type: 'roll',
        description: 'Break through digital security and manipulate computer systems',
        diceExpression: '2d6+tech_level',
        worldId: 'world-test-cyberpunk'
      },
      {
        id: 'skill-streetwise',
        name: 'Streetwise', 
        type: 'roll',
        description: 'Navigate the dangerous urban underworld',
        diceExpression: '2d6+street_cred',
        worldId: 'world-test-cyberpunk'
      }
    ],
    settings: {
      toneSettings: {
        complexity: 'medium',
        maturityLevel: 'mature',
        pacing: 'moderate',
        focusAreas: ['technology', 'urban-survival'],
        narrativeStyle: 'gritty-realism'
      },
      attributePointPool: 20,
      skillPointPool: 15
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'world-test-fantasy',
    name: 'Realm of Aethermoor',
    description: 'A mystical kingdom where ancient magic flows through floating islands and dragons soar between crystal spires.',
    genre: 'High Fantasy',
    attributes: [
      {
        id: 'attr-magic-power',
        name: 'Magic Power',
        type: 'number',
        description: 'Your connection to the arcane forces that govern reality',
        defaultValue: 4,
        minValue: 0,
        maxValue: 10,
        worldId: 'world-test-fantasy'
      },
      {
        id: 'attr-noble-standing',
        name: 'Noble Standing',
        type: 'number',
        description: 'Your status and influence among the ruling houses',
        defaultValue: 2,
        minValue: 0,
        maxValue: 10,
        worldId: 'world-test-fantasy'
      }
    ],
    skills: [
      {
        id: 'skill-spellcasting',
        name: 'Spellcasting',
        type: 'roll',
        description: 'Channel magical energies to reshape reality',
        diceExpression: '2d8+magic_power',
        worldId: 'world-test-fantasy'
      },
      {
        id: 'skill-lore',
        name: 'Ancient Lore',
        type: 'roll',
        description: 'Knowledge of forgotten histories and magical secrets',
        diceExpression: '2d6+magic_power',
        worldId: 'world-test-fantasy'
      }
    ],
    settings: {
      toneSettings: {
        complexity: 'high',
        maturityLevel: 'teen',
        pacing: 'epic',
        focusAreas: ['magic', 'political-intrigue'],
        narrativeStyle: 'heroic-fantasy'
      },
      attributePointPool: 20,
      skillPointPool: 15
    },
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  }
];

const TEST_CHARACTERS = [
  {
    id: 'char-test-hacker',
    name: 'Zara "Ghost" Chen',
    description: 'A elite corporate hacker with neural implants and a mysterious past',
    worldId: 'world-test-cyberpunk',
    level: 1,
    isPlayer: true,
    attributes: [
      {
        id: 'char-attr-1',
        characterId: 'char-test-hacker',
        name: 'Tech Level',
        baseValue: 8,
        modifiedValue: 8
      },
      {
        id: 'char-attr-2', 
        characterId: 'char-test-hacker',
        name: 'Street Cred',
        baseValue: 6,
        modifiedValue: 6
      }
    ],
    skills: [
      {
        id: 'char-skill-1',
        characterId: 'char-test-hacker',
        name: 'Hacking',
        level: 5
      },
      {
        id: 'char-skill-2',
        characterId: 'char-test-hacker', 
        name: 'Streetwise',
        level: 3
      }
    ],
    background: {
      history: 'Former Arasaka security specialist who discovered corporate secrets',
      personality: 'Cynical but fiercely loyal to chosen allies',
      physicalDescription: 'Lean build with silver neural interface ports',
      goals: ['Expose corporate corruption', 'Find missing sister'],
      fears: ['Corporate retaliation', 'Loss of identity'],
      relationships: []
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: []
    },
    inventory: {
      characterId: 'char-test-hacker',
      items: [],
      capacity: 100,
      categories: []
    },
    createdAt: '2024-01-01T01:00:00.000Z',
    updatedAt: '2024-01-01T01:00:00.000Z'
  },
  {
    id: 'char-test-mage',
    name: 'Lyralei Moonwhisper',
    description: 'A young elven mage dedicated to preserving ancient magical knowledge',
    worldId: 'world-test-fantasy',
    level: 1,
    isPlayer: true,
    attributes: [
      {
        id: 'char-attr-3',
        characterId: 'char-test-mage',
        name: 'Magic Power',
        baseValue: 9,
        modifiedValue: 9
      },
      {
        id: 'char-attr-4',
        characterId: 'char-test-mage',
        name: 'Noble Standing',
        baseValue: 4,
        modifiedValue: 4
      }
    ],
    skills: [
      {
        id: 'char-skill-3',
        characterId: 'char-test-mage',
        name: 'Spellcasting',
        level: 6
      },
      {
        id: 'char-skill-4',
        characterId: 'char-test-mage',
        name: 'Ancient Lore', 
        level: 4
      }
    ],
    background: {
      history: 'Trained at the prestigious Silverwind Academy of magical arts',
      personality: 'Wise beyond her years, passionate about knowledge preservation',
      physicalDescription: 'Tall and graceful with distinctive silver-white hair',
      goals: ['Master forbidden magic', 'Restore the Great Library'],
      fears: ['Magic corruption', 'Forgotten knowledge being lost'],
      relationships: []
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: []
    },
    inventory: {
      characterId: 'char-test-mage',
      items: [],
      capacity: 100,
      categories: []
    },
    createdAt: '2024-01-02T01:00:00.000Z',
    updatedAt: '2024-01-02T01:00:00.000Z'
  }
];

async function seedTestData() {
  console.log('🌱 Seeding visual test data...');
  
  let browser;
  try {
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Navigate to app to initialize it, but don't wait for network idle (can hang)
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    
    // Wait for React to render
    await page.waitForTimeout(1000);
    
    // Simple approach: seed data and reload
    await page.evaluate(({ worlds, characters }) => {
      // Prepare data in Zustand persist format
      const worldStoreData = {
        state: {
          worlds: worlds.reduce((acc, world) => {
            acc[world.id] = world;
            return acc;
          }, {}),
          currentWorldId: worlds[0].id,
          error: null,
          loading: false
        },
        version: 1
      };
      
      const characterStoreData = {
        state: {
          characters: characters.reduce((acc, character) => {
            acc[character.id] = character;
            return acc;
          }, {}),
          currentCharacterId: characters[0].id,
          error: null,
          loading: false
        },
        version: 1
      };
      
      // Set in localStorage (primary approach)
      localStorage.setItem('narraitor-world-store', JSON.stringify(worldStoreData));
      localStorage.setItem('narraitor-character-store', JSON.stringify(characterStoreData));
      console.log(`✅ Seeded ${worlds.length} worlds and ${characters.length} characters to localStorage`);
    }, { worlds: TEST_WORLDS, characters: TEST_CHARACTERS });
    
    // Reload to pickup the seeded data
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1000);
    
    console.log('✅ Visual test data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if dev server is running
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3000');
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Dev server not running on localhost:3000');
    console.error('   Please start the dev server with: npm run dev');
    process.exit(1);
  }
}

async function main() {
  await checkDevServer();
  await seedTestData();
}

if (require.main === module) {
  main().catch(console.error);
}