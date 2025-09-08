import { Page } from '@playwright/test';

// Deterministic PNG data URIs to avoid network and randomness in visuals
// 1x1 solid light-gray PNG that scales consistently in layout
const STABLE_WORLD_IMAGE =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/awp2z0AAAAASUVORK5CYII=';

// 1x1 solid light-gray PNG for portraits
const STABLE_PORTRAIT_IMAGE = STABLE_WORLD_IMAGE;

export const SAMPLE_WORLDS = [
  {
    id: 'world-cyberpunk-2077',
    name: 'Cyberpunk Neo-Tokyo',
    description: 'A dystopian future where corporations rule the world and cybernetic enhancements define social status',
    genre: 'cyberpunk',
    image: {
      url: '/visual-assets/world-cyberpunk.png',
      alt: 'Cyberpunk cityscape'
    },
    attributes: [
      {
        name: 'Tech Level',
        type: 'number' as const,
        description: 'How advanced your cybernetic modifications are',
        defaultValue: 0,
        minValue: 0,
        maxValue: 10,
      },
      {
        name: 'Street Cred',
        type: 'number' as const,
        description: 'Your reputation in the underground',
        defaultValue: 0,
        minValue: 0,
        maxValue: 10,
      }
    ],
    skills: [
      {
        name: 'Hacking',
        type: 'roll' as const,
        description: 'Navigate cyberspace and break digital barriers',
        diceExpression: '2d6+tech'
      },
      {
        name: 'Streetwise',
        type: 'roll' as const,
        description: 'Navigate the urban underworld',
        diceExpression: '2d6+street_cred'
      }
    ],
    settings: {
      toneSettings: {
        complexity: 'medium' as const,
        maturityLevel: 'mature' as const,
        pacing: 'moderate' as const,
        focusAreas: ['technology', 'social-inequality'],
        narrativeStyle: 'gritty-realism' as const
      }
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'world-fantasy-realm',
    name: 'Aethermoor',
    description: 'A magical realm where ancient dragons soar above floating cities and arcane mysteries shape reality',
    genre: 'fantasy',
    attributes: [
      {
        name: 'Magic Power',
        type: 'number' as const,
        description: 'Your connection to the arcane forces',
        defaultValue: 4,
        minValue: 0,
        maxValue: 10,
      },
      {
        name: 'Noble Standing',
        type: 'number' as const,
        description: 'Your status among the ruling houses',
        defaultValue: 2,
        minValue: 0,
        maxValue: 10,
      }
    ],
    skills: [
      {
        name: 'Spellcasting',
        type: 'roll' as const,
        description: 'Channel magical energies to alter reality',
        diceExpression: '2d8+magic'
      },
      {
        name: 'Dragon Lore',
        type: 'roll' as const,
        description: 'Knowledge of ancient dragon customs and language',
        diceExpression: '2d6+noble_standing'
      }
    ],
    settings: {
      toneSettings: {
        complexity: 'high' as const,
        maturityLevel: 'teen' as const,
        pacing: 'epic' as const,
        focusAreas: ['magic', 'political-intrigue'],
        narrativeStyle: 'heroic-fantasy' as const
      }
    },
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  }
];

export const SAMPLE_CHARACTERS = [
  {
    id: 'char-cyberpunk-hacker',
    name: 'Nova "Ghost" Chen',
    description: 'Elite corporate hacker turned underground resistance fighter',
    worldId: 'world-cyberpunk-2077',
    level: 3,
    attributes: [
      {
        id: 'attr-tech-level',
        characterId: 'char-cyberpunk-hacker',
        name: 'Tech Level',
        baseValue: 8,
        modifiedValue: 8,
        category: 'Core'
      },
      {
        id: 'attr-street-cred',
        characterId: 'char-cyberpunk-hacker',
        name: 'Street Cred',
        baseValue: 6,
        modifiedValue: 6,
        category: 'Core'
      }
    ],
    skills: [
      {
        id: 'skill-hacking',
        characterId: 'char-cyberpunk-hacker',
        name: 'Hacking',
        level: 12,
        category: 'Technical'
      },
      {
        id: 'skill-streetwise',
        characterId: 'char-cyberpunk-hacker',
        name: 'Streetwise',
        level: 8,
        category: 'Social'
      }
    ],
    background: {
      history: 'Former Arasaka security specialist who discovered dark corporate secrets',
      personality: 'Cynical but loyal, values freedom over security',
      goals: ['Expose corporate corruption', 'Protect the innocent'],
      fears: ['Corporate retaliation', 'Loss of freedom'],
      physicalDescription: 'Lean build with cybernetic eye implant and neural interface ports',
      relationships: [],
      isKnownFigure: false
    },
    isPlayer: true,
    status: {
      health: 85,
      maxHealth: 100,
      conditions: ['Cybernetic Enhancement'],
      location: 'Neo-Tokyo Underground'
    },
    inventory: {
      characterId: 'char-cyberpunk-hacker',
      items: [],
      capacity: 15,
      categories: ['Tech', 'Weapons', 'Data']
    },
    portrait: {
      type: 'ai-generated',
      url: '/visual-assets/portrait-cyberpunk.png',
      generatedAt: '2024-01-01T01:00:00.000Z',
      prompt: 'Cyberpunk hacker with tech augments'
    },
    createdAt: '2024-01-01T01:00:00.000Z',
    updatedAt: '2024-01-01T01:00:00.000Z'
  },
  // Cyberpunk character without portrait (to validate empty portrait state)
  {
    id: 'char-cyberpunk-operative',
    name: 'Kade "Null" Armitage',
    description: 'Field operative who prefers to stay off-grid',
    worldId: 'world-cyberpunk-2077',
    level: 2,
    attributes: [
      {
        id: 'attr-tech-level-k',
        characterId: 'char-cyberpunk-operative',
        name: 'Tech Level',
        baseValue: 5,
        modifiedValue: 5,
        category: 'Core'
      },
      {
        id: 'attr-street-cred-k',
        characterId: 'char-cyberpunk-operative',
        name: 'Street Cred',
        baseValue: 7,
        modifiedValue: 7,
        category: 'Core'
      }
    ],
    skills: [
      {
        id: 'skill-surveillance',
        characterId: 'char-cyberpunk-operative',
        name: 'Surveillance',
        level: 6,
        category: 'Technical'
      },
      {
        id: 'skill-infiltration',
        characterId: 'char-cyberpunk-operative',
        name: 'Infiltration',
        level: 5,
        category: 'Covert'
      }
    ],
    background: {
      history: 'A former corporate asset who disappeared from official records.',
      personality: 'Quiet, calculated, and resourceful',
      goals: ['Protect their identity', 'Expose corruption'],
      fears: ['Being tracked', 'Compromised safehouses'],
      physicalDescription: 'Athletic build with muted cybernetic enhancements',
      relationships: [],
      isKnownFigure: false
    },
    isPlayer: true,
    status: {
      health: 90,
      maxHealth: 100,
      conditions: [],
      location: 'Unknown'
    },
    inventory: {
      characterId: 'char-cyberpunk-operative',
      items: [],
      capacity: 15,
      categories: ['Tech', 'Tools']
    },
    createdAt: '2024-01-01T01:30:00.000Z',
    updatedAt: '2024-01-01T01:30:00.000Z'
  },
  {
    id: 'char-fantasy-mage',
    name: 'Lyralei Moonwhisper',
    description: 'Young elven archmage seeking to restore balance to the realm',
    worldId: 'world-fantasy-realm',
    level: 7,
    attributes: [
      {
        id: 'attr-magic-power',
        characterId: 'char-fantasy-mage',
        name: 'Magic Power',
        baseValue: 9,
        modifiedValue: 9,
        category: 'Mystical'
      },
      {
        id: 'attr-noble-standing',
        characterId: 'char-fantasy-mage',
        name: 'Noble Standing',
        baseValue: 4,
        modifiedValue: 4,
        category: 'Social'
      }
    ],
    skills: [
      {
        id: 'skill-spellcasting',
        characterId: 'char-fantasy-mage',
        name: 'Spellcasting',
        level: 14,
        category: 'Magic'
      },
      {
        id: 'skill-dragon-lore',
        characterId: 'char-fantasy-mage',
        name: 'Dragon Lore',
        level: 7,
        category: 'Knowledge'
      }
    ],
    background: {
      history: 'Trained in the ancient towers of Silverwind Academy',
      personality: 'Wise beyond her years, passionate about preserving magical knowledge',
      goals: ['Restore magical balance', 'Preserve ancient knowledge'],
      fears: ['Loss of magic', 'Corruption of nature'],
      physicalDescription: 'Tall and graceful with silver hair and luminous blue eyes',
      relationships: [],
      isKnownFigure: false
    },
    isPlayer: true,
    status: {
      health: 95,
      maxHealth: 100,
      conditions: ['Magical Aura'],
      location: 'Silverwind Academy'
    },
    inventory: {
      characterId: 'char-fantasy-mage',
      items: [],
      capacity: 12,
      categories: ['Magical Items', 'Scrolls', 'Reagents']
    },
    // No portrait for fantasy mage to avoid external asset
    createdAt: '2024-01-02T01:00:00.000Z',
    updatedAt: '2024-01-02T01:00:00.000Z'
  },
  // Fantasy character with portrait (to validate has-image state)
  {
    id: 'char-fantasy-ranger',
    name: 'Thalen Oakstride',
    description: 'Ranger of Aethermoor sworn to protect ancient paths',
    worldId: 'world-fantasy-realm',
    level: 5,
    attributes: [
      {
        id: 'attr-magic-power-r',
        characterId: 'char-fantasy-ranger',
        name: 'Magic Power',
        baseValue: 3,
        modifiedValue: 3,
        category: 'Mystical'
      },
      {
        id: 'attr-noble-standing-r',
        characterId: 'char-fantasy-ranger',
        name: 'Noble Standing',
        baseValue: 1,
        modifiedValue: 1,
        category: 'Social'
      }
    ],
    skills: [
      {
        id: 'skill-archery',
        characterId: 'char-fantasy-ranger',
        name: 'Archery',
        level: 10,
        category: 'Combat'
      },
      {
        id: 'skill-tracking',
        characterId: 'char-fantasy-ranger',
        name: 'Tracking',
        level: 9,
        category: 'Survival'
      }
    ],
    background: {
      history: 'Guardian of the greenways and hidden glades of Aethermoor.',
      personality: 'Stoic, perceptive, and loyal',
      goals: ['Protect the realm', 'Preserve ancient lore'],
      fears: ['Blight of the old forest', 'Waning magic'],
      physicalDescription: 'Tall, hooded figure with keen eyes and steady aim',
      relationships: [],
      isKnownFigure: false
    },
    portrait: {
      type: 'ai-generated',
      url: '/visual-assets/portrait-fantasy.png',
      generatedAt: '2024-01-02T01:15:00.000Z',
      prompt: 'Ranger portrait'
    },
    isPlayer: true,
    status: {
      health: 95,
      maxHealth: 100,
      conditions: [],
      location: 'Forest Edge'
    },
    inventory: {
      characterId: 'char-fantasy-ranger',
      items: [],
      capacity: 12,
      categories: ['Gear', 'Supplies']
    },
    createdAt: '2024-01-02T01:15:00.000Z',
    updatedAt: '2024-01-02T01:15:00.000Z'
  }
];

export const SAMPLE_GAME_SESSIONS = [
  {
    id: 'session-cyberpunk-ghost',
    worldId: 'world-cyberpunk-2077',
    characterId: 'char-cyberpunk-hacker',
    name: 'The Data Heist',
    status: 'active' as const,
    currentTurn: 3,
    totalTurns: 3,
    lastPlayedAt: '2024-01-01T02:00:00.000Z',
    createdAt: '2024-01-01T02:00:00.000Z',
    updatedAt: '2024-01-01T02:00:00.000Z'
  },
  {
    id: 'session-fantasy-mage',
    worldId: 'world-fantasy-realm',
    characterId: 'char-fantasy-mage',
    name: 'The Dragon\'s Library',
    status: 'active' as const,
    currentTurn: 2,
    totalTurns: 2,
    lastPlayedAt: '2024-01-02T02:00:00.000Z',
    createdAt: '2024-01-02T02:00:00.000Z',
    updatedAt: '2024-01-02T02:00:00.000Z'
  }
];

export const SAMPLE_NARRATIVE_SEGMENTS = [
  {
    id: 'segment-cyberpunk-1',
    worldId: 'world-cyberpunk-2077',
    sessionId: 'session-cyberpunk-ghost',
    content: 'Rain pelts the neon-soaked streets of Neo-Tokyo as you crouch behind a hover-car, fingers dancing across your portable deck. The Arasaka building looms ahead, its security algorithms pulsing like a digital heartbeat. Your contact\'s message burns in your memory: "The data is on floor 47. Get in, get it, get out. Trust no one."',
    type: 'scene' as const,
    characterIds: ['char-cyberpunk-hacker'],
    metadata: {
      mood: 'tense',
      location: 'Neo-Tokyo streets',
      timeOfDay: 'night'
    },
    timestamp: new Date('2024-01-01T02:00:00.000Z'),
    createdAt: '2024-01-01T02:00:00.000Z',
    updatedAt: '2024-01-01T02:00:00.000Z'
  },
  {
    id: 'segment-cyberpunk-2',
    worldId: 'world-cyberpunk-2077',
    sessionId: 'session-cyberpunk-ghost',
    content: 'You slip through the service entrance, your hacking tools making quick work of the electronic lock. Inside, the building hums with corporate efficiency. Security drones patrol the upper floors in predictable patterns. You have two routes to reach floor 47.',
    type: 'action' as const,
    characterIds: ['char-cyberpunk-hacker'],
    metadata: {
      mood: 'focused',
      location: 'Arasaka building interior',
      timeOfDay: 'night'
    },
    timestamp: new Date('2024-01-01T02:01:00.000Z'),
    createdAt: '2024-01-01T02:01:00.000Z',
    updatedAt: '2024-01-01T02:01:00.000Z'
  },
  {
    id: 'segment-fantasy-1',
    worldId: 'world-fantasy-realm',
    sessionId: 'session-fantasy-mage',
    content: 'The ancient tower of Silverwind Academy rises before you, its crystal spires catching the first light of dawn. Master Thalorin\'s urgent message echoes in your mind: "The Dragon Codex has been stolen from the forbidden library. Without it, the realm\'s magical balance will collapse within days."',
    type: 'scene' as const,
    characterIds: ['char-fantasy-mage'],
    metadata: {
      mood: 'urgent',
      location: 'Silverwind Academy',
      timeOfDay: 'dawn'
    },
    timestamp: new Date('2024-01-02T02:00:00.000Z'),
    createdAt: '2024-01-02T02:00:00.000Z',
    updatedAt: '2024-01-02T02:00:00.000Z'
  }
];

export const SAMPLE_DECISIONS = [
  {
    id: 'decision-cyberpunk-route',
    prompt: 'How do you want to reach the 47th floor?',
    options: [
      {
        id: 'option-elevator',
        text: 'Take the maintenance elevator - quieter but slower',
        alignment: 'neutral' as const,
        hint: 'Lower risk of detection but takes more time'
      },
      {
        id: 'option-stairs',
        text: 'Use the emergency stairs - faster but riskier',
        alignment: 'chaotic' as const,
        hint: 'Quick route but higher chance of encountering security'
      },
      {
        id: 'option-ventilation',
        text: 'Crawl through the ventilation system - stealthy but difficult',
        alignment: 'lawful' as const,
        hint: 'Requires high tech skill but nearly undetectable'
      }
    ],
    selectedOptionId: 'option-ventilation',
    selectedAt: new Date('2024-01-01T02:02:00.000Z'),
    characterId: 'char-cyberpunk-hacker',
    contextSummary: 'Infiltrating Arasaka building to steal critical data',
    decisionWeight: 'major' as const,
    narrativeSegmentId: 'segment-cyberpunk-2'
  },
  {
    id: 'decision-fantasy-investigation',
    prompt: 'Where do you begin your investigation into the stolen Dragon Codex?',
    options: [
      {
        id: 'option-library',
        text: 'Examine the crime scene in the forbidden library',
        alignment: 'lawful' as const,
        hint: 'Look for magical traces and clues left behind'
      },
      {
        id: 'option-witnesses',
        text: 'Question the academy students and staff',
        alignment: 'neutral' as const,
        hint: 'Someone might have seen something suspicious'
      },
      {
        id: 'option-divination',
        text: 'Use divination magic to trace the thief',
        alignment: 'chaotic' as const,
        hint: 'Risky but could provide immediate results'
      }
    ],
    characterId: 'char-fantasy-mage',
    contextSummary: 'Beginning investigation into stolen Dragon Codex',
    decisionWeight: 'critical' as const,
    narrativeSegmentId: 'segment-fantasy-1'
  }
];

/**
 * Base seeding for empty state tests - minimal data needed for app initialization
 */
export async function seedBaseData(page: Page): Promise<void> {
  console.log('Seeding base data for empty state tests...');
  
  await page.addInitScript(async () => {
    // Clear any existing data to ensure true empty state
    localStorage.clear();
    
    // Also clear/initialize IndexedDB state to ensure app reads empty stores
    const seedZustandIndexedDB = async (key: string, value: Record<string, unknown>) => {
      return new Promise((resolve) => {
        const request = indexedDB.open('narraitor-state', 1);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('narraitor-store')) {
            db.createObjectStore('narraitor-store');
          }
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const tx = db.transaction(['narraitor-store'], 'readwrite');
          const store = tx.objectStore('narraitor-store');
          const put = store.put({ id: key, value }, key);
          put.onsuccess = () => resolve('✅');
          put.onerror = () => resolve('❌');
        };

        request.onerror = () => resolve('❌');
      });
    };
    
    // Set minimal required configuration
    const emptyWorldStoreData = {
      state: {
        worlds: {},
        currentWorldId: null,
        error: null,
        loading: false
      },
      version: 1
    };
    
    const emptyCharacterStoreData = {
      state: {
        characters: {},
        currentCharacterId: null,
        error: null,
        loading: false
      },
      version: 1
    };
    
    const emptySessionStoreData = {
      state: {
        sessions: {},
        currentSessionId: null,
        savedSessions: {},
        onboardingCompleted: false, // Important: empty state shows onboarding
        error: null,
        loading: false
      },
      version: 2
    };
    
    const emptyNarrativeStoreData = {
      state: {
        segments: {},
        sessionSegments: {},
        decisions: {},
        sessionDecisions: {},
        endedSessions: {},
        currentEnding: null,
        isGeneratingEnding: false,
        endingError: null,
        error: null,
        loading: false
      },
      version: 1
    };
    
    // Seed both IndexedDB (primary) and localStorage (fallback) with empty stores
    await seedZustandIndexedDB('narraitor-world-store', emptyWorldStoreData);
    await seedZustandIndexedDB('narraitor-character-store', emptyCharacterStoreData);
    await seedZustandIndexedDB('narraitor-session-store', emptySessionStoreData);
    await seedZustandIndexedDB('narraitor-narrative-store', emptyNarrativeStoreData);
    // Optional: seed journal store empty to avoid fallback logs
    await seedZustandIndexedDB('narraitor-journal-store', { state: { entries: {}, sessionEntries: {} }, version: 1 });

    localStorage.setItem('narraitor-world-store', JSON.stringify(emptyWorldStoreData));
    localStorage.setItem('narraitor-character-store', JSON.stringify(emptyCharacterStoreData));
    localStorage.setItem('narraitor-session-store', JSON.stringify(emptySessionStoreData));
    localStorage.setItem('narraitor-narrative-store', JSON.stringify(emptyNarrativeStoreData));
    localStorage.setItem('narraitor-journal-store', JSON.stringify({ state: { entries: {}, sessionEntries: {} }, version: 1 }));
    
    // Mark as seeded for debugging
    (window as any).__TEST_SEEDED__ = true;
    
    console.log('✅ Base data seeded for empty state');
  });
}

/**
 * Full data seeding for populated state tests
 */
export async function seedTestData(page: Page): Promise<void> {
  console.log('Seeding full test data for populated state tests...');
  
  // Use addInitScript to set data BEFORE the app loads
  await page.addInitScript(async (testData) => {
    const { SAMPLE_WORLDS, SAMPLE_CHARACTERS, SAMPLE_GAME_SESSIONS, SAMPLE_NARRATIVE_SEGMENTS, SAMPLE_DECISIONS } = testData;
    
    // Convert arrays to Record format that Zustand expects
    const worldsRecord = SAMPLE_WORLDS.reduce((acc: Record<string, unknown>, world) => {
      acc[world.id] = world;
      return acc;
    }, {});
    
    const charactersRecord = SAMPLE_CHARACTERS.reduce((acc: Record<string, unknown>, char) => {
      acc[char.id] = char;
      return acc;
    }, {});
    
    const sessionsRecord = SAMPLE_GAME_SESSIONS.reduce((acc: Record<string, unknown>, session) => {
      acc[session.id] = session;
      return acc;
    }, {});
    
    const segmentsRecord = SAMPLE_NARRATIVE_SEGMENTS.reduce((acc: Record<string, unknown>, segment) => {
      acc[segment.id] = segment;
      return acc;
    }, {});
    
    const decisionsRecord = SAMPLE_DECISIONS.reduce((acc: Record<string, unknown>, decision) => {
      acc[decision.id] = decision;
      return acc;
    }, {});

    console.log('🌍 Attempting to seed', Object.keys(worldsRecord).length, 'worlds');
    console.log('👤 Attempting to seed', Object.keys(charactersRecord).length, 'characters');
    console.log('🎮 Attempting to seed', Object.keys(sessionsRecord).length, 'game sessions');
    console.log('📖 Attempting to seed', Object.keys(segmentsRecord).length, 'narrative segments');
    console.log('🤔 Attempting to seed', Object.keys(decisionsRecord).length, 'decisions');
    
    // Try multiple approaches to seed the data
    const seedApproaches = [];
    
    // Approach 1: Direct Zustand store access through window
    try {
      // Look for useWorldStore on window (may be exposed in dev)
      if ((window as any).useWorldStore) {
        (window as any).useWorldStore.setState({
          worlds: worldsRecord,
          currentWorldId: SAMPLE_WORLDS[0]?.id || null
        });
        seedApproaches.push('✅ Direct useWorldStore.setState');
      }
    } catch (e) {
      seedApproaches.push('❌ Direct useWorldStore.setState: ' + (e as Error).message);
    }
    
    // Approach 2: IndexedDB seeding (primary approach for stores)
    // Seed the exact location and format used by the app's persist adapter
    const seedZustandIndexedDB = async (key: string, value: Record<string, unknown>) => {
      return new Promise((resolve) => {
        const request = indexedDB.open('narraitor-state', 1);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('narraitor-store')) {
            db.createObjectStore('narraitor-store');
          }
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const tx = db.transaction(['narraitor-store'], 'readwrite');
          const store = tx.objectStore('narraitor-store');

          // Persist format used by our adapter: { id, value } saved under key
          const put = store.put({ id: key, value }, key);
          put.onsuccess = () => resolve('✅');
          put.onerror = () => resolve('❌');
        };

        request.onerror = () => resolve('❌');
      });
    };
    
    try {
      const worldStoreData = {
        state: {
          worlds: worldsRecord,
          currentWorldId: SAMPLE_WORLDS[0]?.id || null,
          error: null,
          loading: false
        },
        version: 1
      };
      
      const characterStoreData = {
        state: {
          characters: charactersRecord,
          currentCharacterId: SAMPLE_CHARACTERS[0]?.id || null,
          error: null,
          loading: false
        },
        version: 1
      };
      
      const sessionStoreData = {
        state: {
          sessions: sessionsRecord,
          currentSessionId: SAMPLE_GAME_SESSIONS[0]?.id || null,
          savedSessions: {
            'session-cyberpunk-ghost': {
              id: 'session-cyberpunk-ghost',
              worldId: 'world-cyberpunk-2077',
              characterId: 'char-cyberpunk-hacker',
              lastPlayed: '2024-01-01T02:00:00.000Z',
              narrativeCount: 3
            },
            'session-fantasy-mage': {
              id: 'session-fantasy-mage',
              worldId: 'world-fantasy-realm',
              characterId: 'char-fantasy-mage',
              lastPlayed: '2024-01-02T02:00:00.000Z',
              narrativeCount: 2
            }
          },
          onboardingCompleted: true, // Important: mark onboarding as completed for populated state
          error: null,
          loading: false
        },
        version: 2
      };
      
      const narrativeStoreData = {
        state: {
          segments: segmentsRecord,
          sessionSegments: {
            [SAMPLE_GAME_SESSIONS[0]?.id]: Object.keys(segmentsRecord).filter(id => {
              const segment = segmentsRecord[id] as Record<string, unknown>;
              return segment?.sessionId === SAMPLE_GAME_SESSIONS[0]?.id;
            }),
            [SAMPLE_GAME_SESSIONS[1]?.id]: Object.keys(segmentsRecord).filter(id => {
              const segment = segmentsRecord[id] as Record<string, unknown>;
              return segment?.sessionId === SAMPLE_GAME_SESSIONS[1]?.id;
            })
          },
          decisions: decisionsRecord,
          sessionDecisions: {
            [SAMPLE_GAME_SESSIONS[0]?.id]: Object.keys(decisionsRecord).filter(id => {
              const decision = decisionsRecord[id] as Record<string, unknown>;
              return decision?.narrativeSegmentId && String(decision.narrativeSegmentId).startsWith('segment-cyberpunk');
            }),
            [SAMPLE_GAME_SESSIONS[1]?.id]: Object.keys(decisionsRecord).filter(id => {
              const decision = decisionsRecord[id] as Record<string, unknown>;
              return decision?.narrativeSegmentId && String(decision.narrativeSegmentId).startsWith('segment-fantasy');
            })
          },
          endedSessions: {},
          currentEnding: null,
          isGeneratingEnding: false,
          endingError: null,
          error: null,
          loading: false
        },
        version: 1
      };
      
      // Seed IndexedDB stores (primary approach) in the exact DB/store the app uses
      const worldResult = await seedZustandIndexedDB('narraitor-world-store', worldStoreData);
      const characterResult = await seedZustandIndexedDB('narraitor-character-store', characterStoreData);
      const sessionResult = await seedZustandIndexedDB('narraitor-session-store', sessionStoreData);
      const narrativeResult = await seedZustandIndexedDB('narraitor-narrative-store', narrativeStoreData);
      const journalResult = await seedZustandIndexedDB('narraitor-journal-store', { state: { entries: {}, sessionEntries: {} }, version: 1 });
      
      seedApproaches.push(`${worldResult} IndexedDB world store seeding`);
      seedApproaches.push(`${characterResult} IndexedDB character store seeding`);
      seedApproaches.push(`${sessionResult} IndexedDB session store seeding`);
      seedApproaches.push(`${narrativeResult} IndexedDB narrative store seeding`);
      seedApproaches.push(`${journalResult} IndexedDB journal store seeding`);
      
      // Also seed localStorage as fallback
      localStorage.setItem('narraitor-world-store', JSON.stringify(worldStoreData));
      localStorage.setItem('narraitor-character-store', JSON.stringify(characterStoreData));
      localStorage.setItem('narraitor-session-store', JSON.stringify(sessionStoreData));
      localStorage.setItem('narraitor-narrative-store', JSON.stringify(narrativeStoreData));
      localStorage.setItem('narraitor-journal-store', JSON.stringify({ state: { entries: {}, sessionEntries: {} }, version: 1 }));
      seedApproaches.push('✅ localStorage fallback seeding');
    } catch (e) {
      seedApproaches.push('❌ Storage seeding: ' + (e as Error).message);
    }
    
    // Approach 3: Store test data globally for later access
    const testWindow = window as typeof window & {
      __TEST_WORLDS__?: Record<string, unknown>;
      __TEST_CHARACTERS__?: Record<string, unknown>;
      __TEST_SESSIONS__?: Record<string, unknown>;
      __TEST_SEGMENTS__?: Record<string, unknown>;
      __TEST_DECISIONS__?: Record<string, unknown>;
      __TEST_CURRENT_WORLD_ID__?: string | null;
      __TEST_SEEDED__?: boolean;
    };
    
    testWindow.__TEST_WORLDS__ = worldsRecord;
    testWindow.__TEST_CHARACTERS__ = charactersRecord;
    testWindow.__TEST_SESSIONS__ = sessionsRecord;
    testWindow.__TEST_SEGMENTS__ = segmentsRecord;
    testWindow.__TEST_DECISIONS__ = decisionsRecord;
    
    // Also set current world context for proper navigation/breadcrumbs
    testWindow.__TEST_CURRENT_WORLD_ID__ = SAMPLE_WORLDS[0]?.id || null;
    testWindow.__TEST_SEEDED__ = true;
    
    // Add additional session/narrative data for active session testing
    const sessionWindow = window as typeof window & {
      __TEST_SESSION_SEGMENTS__?: Record<string, string[]>;
      __TEST_SESSION_DECISIONS__?: Record<string, string[]>;
    };
    
    sessionWindow.__TEST_SESSION_SEGMENTS__ = {
      'session-cyberpunk-ghost': Object.keys(segmentsRecord).filter(id => {
        const segment = segmentsRecord[id] as Record<string, unknown>;
        return segment?.sessionId === 'session-cyberpunk-ghost';
      }),
      'session-fantasy-mage': Object.keys(segmentsRecord).filter(id => {
        const segment = segmentsRecord[id] as Record<string, unknown>;
        return segment?.sessionId === 'session-fantasy-mage';
      })
    };
    
    sessionWindow.__TEST_SESSION_DECISIONS__ = {
      'session-cyberpunk-ghost': Object.keys(decisionsRecord).filter(id => {
        const decision = decisionsRecord[id] as Record<string, unknown>;
        return decision?.narrativeSegmentId && String(decision.narrativeSegmentId).includes('cyberpunk');
      }),
      'session-fantasy-mage': Object.keys(decisionsRecord).filter(id => {
        const decision = decisionsRecord[id] as Record<string, unknown>;
        return decision?.narrativeSegmentId && String(decision.narrativeSegmentId).includes('fantasy');
      })
    };
    
    seedApproaches.push('✅ Global window storage');
    
    console.log('🔧 Seed approaches tried:', seedApproaches);
    
    // Force a re-render if we can find React root
    try {
      const event = new CustomEvent('testDataSeeded', {
        detail: { worlds: worldsRecord, characters: charactersRecord, sessions: sessionsRecord, segments: segmentsRecord, decisions: decisionsRecord }
      });
      document.dispatchEvent(event);
      seedApproaches.push('✅ Custom event dispatch');
    } catch (e) {
      seedApproaches.push('❌ Custom event dispatch: ' + (e as Error).message);
    }
    
  }, { SAMPLE_WORLDS, SAMPLE_CHARACTERS, SAMPLE_GAME_SESSIONS, SAMPLE_NARRATIVE_SEGMENTS, SAMPLE_DECISIONS });
  
  console.log('✅ Full test data seeded via addInitScript');
}

/**
 * Mock API endpoints for consistent test behavior
 */
export async function mockApiEndpoints(page: Page): Promise<void> {
  console.log('Setting up API endpoint mocks...');
  
  // Mock narrative generation endpoints - CRITICAL to prevent AI from overriding seeded content
  await page.route('**/api/narrative/generate', async (route) => {
    console.log('🚫 Intercepted narrative generation API call - using seeded data instead');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        segment: {
          id: 'segment-cyberpunk-1',
          content: 'Rain pelts the neon-soaked streets of Neo-Tokyo as you crouch behind a hover-car, fingers dancing across your portable deck. The Arasaka building looms ahead, its security algorithms pulsing like a digital heartbeat.',
          type: 'scene',
          characterIds: ['char-cyberpunk-hacker'],
          metadata: {
            mood: 'tense',
            location: 'Neo-Tokyo streets',
            timeOfDay: 'night'
          }
        }
      }
    });
  });

  await page.route('**/api/narrative/choices', async (route) => {
    console.log('🚫 Intercepted narrative choices API call - using seeded choices');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        choices: [
          {
            id: 'option-elevator',
            text: 'Take the maintenance elevator - quieter but slower',
            alignment: 'neutral',
            hint: 'Lower risk of detection but takes more time'
          },
          {
            id: 'option-stairs', 
            text: 'Use the emergency stairs - faster but riskier',
            alignment: 'chaotic',
            hint: 'Quick route but higher chance of encountering security'
          }
        ]
      }
    });
  });

  // Mock world generation endpoint
  await page.route('**/api/generate-world', async (route) => {
    console.log('Intercepted generate-world API call');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        name: 'Generated Test World',
        genre: 'Science Fiction',
        description: 'A test world generated for visual testing',
        attributes: [],
        skills: [],
        settings: {
          toneSettings: {
            complexity: 'medium',
            maturityLevel: 'teen',
            pacing: 'moderate',
            focusAreas: ['exploration'],
            narrativeStyle: 'adventure'
          }
        }
      }
    });
  });
  
  // Mock character generation endpoint
  await page.route('**/api/generate-character', async (route) => {
    console.log('Intercepted generate-character API call');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        name: 'Generated Test Character',
        concept: 'A test character for visual testing',
        background: 'Generated for testing purposes',
        personality: 'Consistent and reliable'
      }
    });
  });
}

/**
 * Seeds data for QuickPlay form to show populated state
 */
export async function fillQuickPlayForm(page: Page): Promise<void> {
  try {
    // Look for character concept input
    const conceptInput = page.locator('input[placeholder*="character"], textarea[placeholder*="character"]').first();
    if (await conceptInput.count() > 0) {
      await conceptInput.fill('A mysterious wizard seeking ancient knowledge');
    }
    
    // Look for setting/world input
    const settingInput = page.locator('input[placeholder*="setting"], input[placeholder*="world"]').first();
    if (await settingInput.count() > 0) {
      await settingInput.fill('Mystical Academy of Arcane Arts');
    }
  } catch (error) {
    console.log('Could not fill QuickPlay form:', error);
  }
}
