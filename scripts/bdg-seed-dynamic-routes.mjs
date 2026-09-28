#!/usr/bin/env node
//
// Seeds one world + character into a running dev server via CDP, so dynamic
// routes (/worlds/[id], /characters/[id], edit/play/journal variants) render
// real content for a visual crawl without needing a provider key or a full
// world-creation-wizard walkthrough.
//
// Mirrors tests/visual/utils/seedTestData.ts's approach (same IndexedDB
// narraitor-state/narraitor-store shape, same localStorage mirror, same
// tutorialProgress-complete trick to dodge the first-run guided tour) but
// standalone via `bdg cdp Page.addScriptToEvaluateOnNewDocument`, so it can
// run against a browser session outside Playwright.
//
// The world/character objects below are copied from
// tests/fixtures/worlds.fixture.ts (SAMPLE_WORLDS[0]) and
// tests/fixtures/characters.fixture.ts (SAMPLE_CHARACTERS[0]) rather than
// imported, because Node's native TS loader (--experimental-strip-types)
// requires explicit file extensions on relative imports and this repo's
// fixtures use extensionless imports (tests/fixtures/index.ts -> './worlds.fixture'),
// which only a bundler-aware resolver (ts-node, tsx, webpack) can follow.
//
// Usage: node scripts/bdg-seed-dynamic-routes.mjs [devServerUrl]
// Defaults to http://localhost:3000.

import { execFileSync } from 'node:child_process';

const devServerUrl = process.argv[2] || 'http://localhost:3000';

const WORLD = {
  id: 'world-cyberpunk-2077',
  name: 'Cyberpunk Neo-Tokyo',
  description:
    'A dystopian future where corporations rule the world and cybernetic enhancements define social status',
  genre: 'cyberpunk',
  image: {
    url: '/visual-assets/world-cyberpunk.png',
    type: 'ai-generated',
    prompt:
      'A cyberpunk cityscape with neon lights, towering skyscrapers, and flying vehicles in a dystopian future setting',
    generatedAt: '2024-01-01T00:00:00.000Z',
  },
  attributes: [
    {
      id: 'attr-world-cyberpunk-2077-1',
      worldId: 'world-cyberpunk-2077',
      name: 'Tech Level',
      description: 'How advanced your cybernetic modifications are',
      baseValue: 0,
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'attr-world-cyberpunk-2077-2',
      worldId: 'world-cyberpunk-2077',
      name: 'Street Cred',
      description: 'Your reputation in the underground',
      baseValue: 0,
      minValue: 0,
      maxValue: 10,
    },
  ],
  skills: [
    {
      id: 'skill-world-cyberpunk-2077-1',
      worldId: 'world-cyberpunk-2077',
      name: 'Hacking',
      description: 'Navigate cyberspace and break digital barriers',
      difficulty: 'medium',
      baseValue: 0,
      minValue: 0,
      maxValue: 10,
      attributeIds: [],
    },
    {
      id: 'skill-world-cyberpunk-2077-2',
      worldId: 'world-cyberpunk-2077',
      name: 'Streetwise',
      description: 'Navigate the urban underworld',
      difficulty: 'medium',
      baseValue: 0,
      minValue: 0,
      maxValue: 10,
      attributeIds: [],
    },
  ],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 20,
    skillPointPool: 20,
  },
  toneSettings: {
    contentRating: 'R',
    narrativeStyle: 'serious',
    languageComplexity: 'moderate',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const CHARACTER = {
  id: 'char-cyberpunk-hacker',
  name: 'Nova "Ghost" Chen',
  description:
    'A former corporate intrusion specialist who now dismantles surveillance grids for neighborhood crews, carrying every breach map in a battered encrypted deck.',
  worldId: 'world-cyberpunk-2077',
  level: 3,
  isPlayer: true,
  attributes: [
    {
      id: 'char-attr-tech-level',
      characterId: 'char-cyberpunk-hacker',
      worldAttributeId: 'attr-world-cyberpunk-2077-1',
      name: 'Tech Level',
      baseValue: 8,
      modifiedValue: 8,
    },
    {
      id: 'char-attr-street-cred',
      characterId: 'char-cyberpunk-hacker',
      worldAttributeId: 'attr-world-cyberpunk-2077-2',
      name: 'Street Cred',
      baseValue: 6,
      modifiedValue: 6,
    },
  ],
  skills: [
    {
      id: 'char-skill-hacking',
      characterId: 'char-cyberpunk-hacker',
      worldSkillId: 'skill-world-cyberpunk-2077-1',
      name: 'Hacking',
      level: 12,
    },
    {
      id: 'char-skill-streetwise',
      characterId: 'char-cyberpunk-hacker',
      worldSkillId: 'skill-world-cyberpunk-2077-2',
      name: 'Streetwise',
      level: 8,
    },
  ],
  derivedStats: [],
  background: {
    history: 'Former Arasaka security specialist who discovered dark corporate secrets',
    personality: 'Cynical but loyal, values freedom over security',
    goals: ['Expose corporate corruption', 'Protect the innocent'],
    fears: ['Corporate retaliation', 'Loss of freedom'],
    physicalDescription: 'Lean build with cybernetic eye implant and neural interface ports',
    relationships: [],
    isKnownFigure: false,
  },
  status: {
    conditions: ['Cybernetic Enhancement'],
    location: 'Neo-Tokyo Underground',
  },
  inventory: {
    characterId: 'char-cyberpunk-hacker',
    items: [],
    capacity: 15,
    categories: [],
    itemOrder: [],
  },
  portrait: {
    type: 'ai-generated',
    url: '/visual-assets/fixtures/portrait-nova-chen.png',
    generatedAt: '2024-01-01T01:00:00.000Z',
    prompt: 'Cyberpunk hacker with tech augments',
  },
  createdAt: '2024-01-01T01:00:00.000Z',
  updatedAt: '2024-01-01T01:00:00.000Z',
};

// Runs in the page. Kept as a plain function body string (not a template
// literal closure) since CDP ships it to the browser as raw source.
const initScriptSource = `
(function () {
  window.__PLAYWRIGHT__ = true; // stores only expose themselves on window with this flag set

  var WORLD = ${JSON.stringify(WORLD)};
  var CHARACTER = ${JSON.stringify(CHARACTER)};

  localStorage.clear();

  function seedStore(key, value) {
    return new Promise(function (resolve) {
      var request = indexedDB.open('narraitor-state', 1);
      request.onupgradeneeded = function (event) {
        var db = event.target.result;
        if (!db.objectStoreNames.contains('narraitor-store')) {
          db.createObjectStore('narraitor-store');
        }
      };
      request.onsuccess = function (event) {
        var db = event.target.result;
        var tx = db.transaction(['narraitor-store'], 'readwrite');
        var store = tx.objectStore('narraitor-store');
        var put = store.put({ id: key, value: value }, key);
        put.onsuccess = function () { resolve(true); };
        put.onerror = function () { resolve(false); };
      };
      request.onerror = function () { resolve(false); };
    });
  }

  var stores = {
    world: {
      state: { worlds: {}, currentWorldId: WORLD.id, error: null, loading: false },
      version: 1,
    },
    character: {
      state: { characters: {}, currentCharacterId: CHARACTER.id, error: null, loading: false },
      version: 1,
    },
    session: {
      state: {
        savedSessions: {},
        // Mark onboarding complete so a fresh profile doesn't auto-launch the
        // react-joyride guided tour mid-crawl (looks like a full-viewport
        // rendering bug otherwise -- see visual-crawl skill's tour-overlay gotcha).
        tutorialProgress: {
          phases: {
            intro: { completed: true, skipped: false },
            worldCreation: { completed: true, skipped: false, lastStep: 999 },
            worldGeneration: { completed: true, skipped: false, lastStep: 0 },
            characterCreation: { completed: true, skipped: false, lastStep: 5 },
            firstPlay: { completed: true, skipped: false },
          },
          dismissedHints: [],
          lastActiveStep: null,
        },
        error: null,
        loading: false,
      },
      version: 4,
    },
    narrative: {
      state: {
        segments: {}, sessionSegments: {}, decisions: {}, sessionDecisions: {},
        endedSessions: {}, currentEnding: null, isGeneratingEnding: false,
        endingError: null, error: null, loading: false,
      },
      version: 1,
    },
    journal: {
      state: { entries: {}, sessionEntries: {} },
      version: 1,
    },
  };
  stores.world.state.worlds[WORLD.id] = WORLD;
  stores.character.state.characters[CHARACTER.id] = CHARACTER;

  Promise.all([
    seedStore('narraitor-world-store', stores.world),
    seedStore('narraitor-character-store', stores.character),
    seedStore('narraitor-session-store', stores.session),
    seedStore('narraitor-narrative-store', stores.narrative),
    seedStore('narraitor-journal-store', stores.journal),
  ]).then(function () {
    Object.keys(stores).forEach(function (name) {
      localStorage.setItem('narraitor-' + name + '-store', JSON.stringify(stores[name]));
    });
    window.__TEST_SEEDED__ = true;
    console.log('bdg-seed-dynamic-routes: seeded world ' + WORLD.id + ' + character ' + CHARACTER.id);
  });
})();
`;

function bdg(args) {
  return execFileSync('bdg', args, { encoding: 'utf8' });
}

console.log(`Seeding dynamic-route fixture data into ${devServerUrl} via bdg CDP...`);
bdg([devServerUrl]);
bdg(['cdp', 'Page.addScriptToEvaluateOnNewDocument', '--params', JSON.stringify({ source: initScriptSource })]);
bdg(['cdp', 'Page.navigate', '--params', JSON.stringify({ url: `${devServerUrl}/worlds/${WORLD.id}` })]);

// Give the seed's async IndexedDB writes and the app's own hydration +
// client-side render a moment to settle before checking the result.
execFileSync('sleep', ['2']);

const bodyText = bdg(['dom', 'eval', 'document.body.innerText.slice(0, 200)']).trim();
if (!bodyText || /not found|404/i.test(bodyText)) {
  console.error('Seed verification failed -- /worlds/' + WORLD.id + ' did not render seeded content:');
  console.error(bodyText);
  process.exit(1);
}

console.log('Seed verified. /worlds/' + WORLD.id + ' rendered:');
console.log(bodyText);
console.log(`\nSeeded routes to crawl: /worlds/${WORLD.id}, /worlds/${WORLD.id}/play, /characters/${CHARACTER.id}, /characters/${CHARACTER.id}/edit, /worlds/${WORLD.id}/journal`);
