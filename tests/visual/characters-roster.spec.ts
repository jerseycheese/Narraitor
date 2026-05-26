import { test, expect } from '@playwright/test';
import { getTimestamp } from '@/lib/utils';

const GET_TIMESTAMP_SOURCE = getTimestamp.toString();
const WORLD_ID = 'world-roster-playwright';
const CHAR_ALPHA = 'char-alpha-playwright';
const CHAR_BETA = 'char-beta-playwright';

const SEED_PAYLOAD = {
  world: {
    id: WORLD_ID,
    name: 'Playwright Test World',
    description: 'Seeded world to exercise character roster context',
    genre: 'fantasy',
  },
  characters: [
    {
      id: CHAR_ALPHA,
      name: 'Hero Alpha',
      description: 'Lead investigator from the capital',
      highlight: 'Investigating the ruins near the falls.',
      relationship: {
        targetId: CHAR_BETA,
        sentiment: 65,
        trust: 84,
        tension: 45,
      },
    },
    {
      id: CHAR_BETA,
      name: 'Envoy Beta',
      description: 'Diplomatic envoy assigned to border talks',
      highlight: 'Monitoring the northern pass for unrest.',
      relationship: {
        targetId: CHAR_ALPHA,
        sentiment: 15,
        trust: 55,
        tension: 20,
      },
    },
  ],
};

test.describe('Character roster context', () => {
  test('shows narrative threads and relationships for each character', async ({
    page,
    baseURL,
  }) => {
    await page.addInitScript(
      async ({ getTimestampSource, seed }) => {
        const instantiateGetTimestamp = (source: string) =>
          new Function(`return (${source});`)() as () => string;
        const getTs = instantiateGetTimestamp(getTimestampSource);
        const now = getTs();
        const dbName = 'narraitor-state';
        const storeName = 'narraitor-store';

        function put(key: string, value: unknown): Promise<void> {
          return new Promise((resolve) => {
            const open = indexedDB.open(dbName, 1);
            open.onupgradeneeded = () => {
              const db = open.result;
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
              }
            };
            open.onsuccess = () => {
              const db = open.result;
              const tx = db.transaction(storeName, 'readwrite');
              tx.objectStore(storeName).put({ id: key, value }, key);
              tx.oncomplete = () => resolve();
              tx.onerror = () => resolve();
            };
            open.onerror = () => resolve();
          });
        }

        const [alpha, beta] = seed.characters;

        const worldState = {
          worldId: seed.world.id,
          version: 1,
          lastModified: now,
          npcRelationships: {},
          majorEvents: [
            {
              id: 'event-alpha-discovery',
              description:
                'Hero Alpha discovered ancient artifacts in the flooded ruins, uncovering evidence of the lost civilization',
              timestamp: now,
              characterId: alpha.id,
              sessionId: 'session-alpha',
            },
          ],
          playerCharacterThreads: {
            [`thread-${alpha.id}`]: {
              id: `thread-${alpha.id}`,
              characterId: alpha.id,
              worldId: seed.world.id,
              summary: alpha.highlight,
              highlights: [alpha.highlight],
              sessionIds: ['session-alpha'],
              crossCharacterReferences: [
                {
                  characterId: beta.id,
                  summary:
                    'Envoy Beta warned Alpha about supply shortages in the port district.',
                  sessionId: 'session-beta',
                  lastReferencedAt: now,
                },
              ],
              lastUpdated: now,
            },
            [`thread-${beta.id}`]: {
              id: `thread-${beta.id}`,
              characterId: beta.id,
              worldId: seed.world.id,
              summary: beta.highlight,
              highlights: [beta.highlight],
              sessionIds: ['session-beta'],
              crossCharacterReferences: [
                {
                  characterId: alpha.id,
                  summary:
                    'Hero Alpha requested support before entering the ruins.',
                  sessionId: 'session-alpha',
                  lastReferencedAt: now,
                },
              ],
              lastUpdated: now,
            },
          },
          characterRelationships: {
            [alpha.id]: {
              [beta.id]: {
                sentiment: alpha.relationship.sentiment,
                trust: alpha.relationship.trust,
                tension: alpha.relationship.tension,
                lastInteraction: now,
                sessionId: 'session-alpha',
              },
            },
            [beta.id]: {
              [alpha.id]: {
                sentiment: beta.relationship.sentiment,
                trust: beta.relationship.trust,
                tension: beta.relationship.tension,
                lastInteraction: now,
                sessionId: 'session-beta',
              },
            },
          },
        } as const;

        const worldPersist = {
          state: {
            worlds: {
              [seed.world.id]: {
                ...seed.world,
                attributes: [],
                skills: [],
                derivedStats: [],
                createdAt: now,
                updatedAt: now,
              },
            },
            entities: {
              [seed.world.id]: {
                ...seed.world,
                attributes: [],
                skills: [],
                derivedStats: [],
                createdAt: now,
                updatedAt: now,
              },
            },
            worldStates: {
              [seed.world.id]: worldState,
            },
            currentWorldId: seed.world.id,
            currentEntityId: seed.world.id,
            error: null,
            loading: false,
          },
          version: 2,
        } as const;

        const characterEntries = Object.fromEntries(
          seed.characters.map((character) => [
            character.id,
            {
              id: character.id,
              name: character.name,
              description: character.description,
              worldId: seed.world.id,
              level: 3,
              isPlayer: true,
              attributes: [],
              skills: [],
              derivedStats: [],
              background: {
                history:
                  'A well-traveled specialist who keeps extensive notes.',
                personality: 'Methodical yet personable',
                goals: ['Secure the northern settlements'],
                fears: ['Losing the trail'],
                relationships: [],
              },
              status: { health: 100, maxHealth: 100, conditions: [] },
              inventory: {
                characterId: character.id,
                items: [],
                capacity: 100,
                categories: [],
                itemOrder: [],
              },
              createdAt: now,
              updatedAt: now,
            },
          ])
        );

        const characterPersist = {
          state: {
            characters: characterEntries,
            entities: characterEntries,
            worldCharacterIds: {
              [seed.world.id]: seed.characters.map((c) => c.id),
            },
            currentCharacterId: seed.characters[0].id,
            currentEntityId: seed.characters[0].id,
            error: null,
            loading: false,
          },
          version: 2,
        } as const;

        const sessionPersist = {
          state: {
            id: null,
            status: 'initializing',
            currentSceneId: null,
            playerChoices: [],
            error: null,
            worldId: null,
            characterId: null,
            savedSessions: {},
            templateHistory: [],
            autoSave: {
              enabled: true,
              lastSaveTime: null,
              status: 'idle',
              errorMessage: null,
              totalSaves: 0,
            },
            onboardingCompleted: true,
          },
          version: 2,
        } as const;

        await Promise.all([
          put('narraitor-world-store', worldPersist),
          put('narraitor-character-store', characterPersist),
          put('narraitor-session-store', sessionPersist),
        ]);

        // Patch stores directly once they mount — bypasses the async IndexedDB
        // hydration race. Mirrors the pattern in seedTestData.ts.
        function patchStores(): boolean {
          const tw = window as typeof window & {
            useWorldStore?: { setState?: (fn: (s: unknown) => unknown) => void };
            useCharacterStore?: { setState?: (fn: (s: unknown) => unknown) => void };
          };
          if (!tw.useWorldStore?.setState || !tw.useCharacterStore?.setState) {
            return false;
          }
          tw.useWorldStore.setState((s: unknown) => ({
            ...(s as object),
            worlds: { ...(s as { worlds?: object }).worlds, ...worldPersist.state.worlds },
            entities: { ...(s as { entities?: object }).entities, ...worldPersist.state.entities },
            worldStates: { ...(s as { worldStates?: object }).worldStates, ...worldPersist.state.worldStates },
            currentWorldId: worldPersist.state.currentWorldId,
            currentEntityId: worldPersist.state.currentEntityId,
          }));
          tw.useCharacterStore.setState((s: unknown) => ({
            ...(s as object),
            characters: { ...(s as { characters?: object }).characters, ...characterPersist.state.characters },
            entities: { ...(s as { entities?: object }).entities, ...characterPersist.state.entities },
            worldCharacterIds: { ...(s as { worldCharacterIds?: object }).worldCharacterIds, ...characterPersist.state.worldCharacterIds },
            currentCharacterId: characterPersist.state.currentCharacterId,
            currentEntityId: characterPersist.state.currentEntityId,
          }));
          return true;
        }

        if (!patchStores()) {
          let attempts = 0;
          const intervalId = window.setInterval(() => {
            attempts += 1;
            if (patchStores() || attempts >= 50) {
              window.clearInterval(intervalId);
            }
          }, 100);
        }
      },
      { getTimestampSource: GET_TIMESTAMP_SOURCE, seed: SEED_PAYLOAD }
    );

    await page.goto(`${baseURL}/characters?worldId=${WORLD_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    const cards = page.locator('.component-character-card');
    await expect(cards).toHaveCount(2);

    // Hero Alpha card should show the major event and connection to Envoy Beta
    await expect(
      cards
        .first()
        .locator(
          'text=Hero Alpha discovered ancient artifacts in the flooded ruins'
        )
    ).toBeVisible();
    await expect(cards.first().locator('text=Envoy Beta')).toBeVisible();

    // Envoy Beta card should show connection to Hero Alpha (no major event for Beta)
    await expect(cards.nth(1).locator('text=Hero Alpha')).toBeVisible();

    await expect(page).toHaveScreenshot('characters-roster.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });
});
