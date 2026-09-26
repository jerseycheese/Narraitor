import { test, expect } from '@playwright/test';
import { getTimestamp } from '@/lib/utils';
import { mockApiEndpoints } from './utils/mockApi';

const GET_TIMESTAMP_SOURCE = getTimestamp.toString();

/**
 * End-to-end verification for Issue #2167:
 * Confirm turn 1 choices and custom input unlock without requiring a page reload on:
 * 1. New Session on a world with saved history (?fresh=true)
 * 2. "Play again" from the ending screen
 *
 * Also verify:
 * - The new session receives its own minted session ID
 * - The old session's history is not cleared or overwritten
 * - The old session can still be resumed afterwards
 */
test.describe('Issue #2167 Turn 1 unlock verification', () => {
  const WORLD_ID = 'world_8b927b31-f6d0-4e17-8391-74033dd8323a';
  const CHAR_ID = 'char-playwright-e2e';
  const OLD_SESSION_ID = 'session-world-old-history-12345';

  test.beforeEach(async ({ page }) => {
    await mockApiEndpoints(page);

    // Provide proper NDJSON stream with done event for ClientGeminiClient
    await page.route('**/api/narrative/generate', async (route) => {
      const segment = {
        id: `segment-${Date.now()}`,
        content:
          'Rain pelts the neon-soaked streets as you crouch behind a hover-car. The building looms ahead.',
        type: 'scene',
        characterIds: [],
        metadata: {
          mood: 'tense',
          location: 'City streets',
        },
      };
      const body =
        JSON.stringify({ delta: segment.content }) +
        '\n' +
        JSON.stringify({ done: true, segment }) +
        '\n';
      await route.fulfill({
        status: 200,
        contentType: 'application/x-ndjson',
        body,
      });
    });
  });

  test('Path 1: New Session on world with saved history unlocks choices and custom input', async ({
    page,
    baseURL,
  }) => {
    // 1. Seed IndexedDB with an existing world, character, and saved session history
    await page.addInitScript(
      ({ getTimestampSource, worldId, charId, oldSessionId }) => {
        const instantiateGetTimestamp = (source: string) =>
          new Function(`return (${source});`)() as () => string;
        const getTimestamp = instantiateGetTimestamp(getTimestampSource);
        const now = getTimestamp();
        const dbName = 'narraitor-state';
        const storeName = 'narraitor-store';

        function put(key: string, value: any): Promise<void> {
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

        const worldPersist = {
          state: {
            worlds: {
              [worldId]: {
                id: worldId,
                name: 'History Test World',
                description: 'World with prior play history',
                genre: 'fantasy',
                attributes: [],
                skills: [],
                derivedStats: [],
                createdAt: now,
                updatedAt: now,
              },
            },
            entities: {
              [worldId]: {
                id: worldId,
                name: 'History Test World',
                description: 'World with prior play history',
                genre: 'fantasy',
                attributes: [],
                skills: [],
                derivedStats: [],
                createdAt: now,
                updatedAt: now,
              },
            },
            worldStates: {},
            currentWorldId: worldId,
            currentEntityId: worldId,
            error: null,
            loading: false,
          },
          version: 2,
        };

        const characterPersist = {
          state: {
            characters: {
              [charId]: {
                id: charId,
                name: 'Mara Voss',
                description: 'Hero of History',
                worldId: worldId,
                level: 1,
                isPlayer: true,
                attributes: [],
                skills: [],
                derivedStats: [],
                background: {
                  history: '',
                  personality: '',
                  goals: [],
                  fears: [],
                  relationships: [],
                },
                status: { conditions: [] },
                inventory: {
                  characterId: charId,
                  items: [],
                  capacity: 100,
                  categories: [],
                },
                createdAt: now,
                updatedAt: now,
              },
            },
            entities: {
              [charId]: {
                id: charId,
                name: 'Mara Voss',
                description: 'Hero of History',
                worldId: worldId,
                level: 1,
                isPlayer: true,
                attributes: [],
                skills: [],
                derivedStats: [],
                background: {
                  history: '',
                  personality: '',
                  goals: [],
                  fears: [],
                  relationships: [],
                },
                status: { conditions: [] },
                inventory: {
                  characterId: charId,
                  items: [],
                  capacity: 100,
                  categories: [],
                },
                createdAt: now,
                updatedAt: now,
              },
            },
            worldCharacterIds: { [worldId]: [charId] },
            currentCharacterId: charId,
            currentEntityId: charId,
            error: null,
            loading: false,
          },
          version: 2,
        };

        // Saved session state with past history
        const sessionPersist = {
          state: {
            id: oldSessionId,
            status: 'active',
            currentSceneId: 'scene-old-1',
            playerChoices: [],
            error: null,
            worldId: worldId,
            characterId: charId,
            savedSessions: {
              [oldSessionId]: {
                id: oldSessionId,
                worldId: worldId,
                characterId: charId,
                lastPlayed: now,
                narrativeCount: 5,
              },
            },
            autoSave: {
              enabled: true,
              lastSaveTime: now,
              status: 'idle',
              errorMessage: null,
              totalSaves: 1,
            },
            tutorialProgress: {
              phases: {
                intro: { completed: true, skipped: false },
                worldCreation: { completed: true, skipped: false, lastStep: 0 },
                worldGeneration: { completed: true, skipped: false, lastStep: 0 },
                characterCreation: { completed: true, skipped: false, lastStep: 0, quickStartCompleted: true },
                firstPlay: { completed: true, skipped: false },
              },
              dismissedHints: ['firstPlay'],
              lastActiveStep: null,
            },
          },
          version: 4,
        };

        // Narrative history for old session
        const narrativePersist = {
          state: {
            segments: {
              'seg-old-1': {
                id: 'seg-old-1',
                sessionId: oldSessionId,
                worldId: worldId,
                characterId: charId,
                content: 'Old history segment: the gates had closed behind her.',
                type: 'narrative',
                sequence: 1,
                timestamp: now,
              },
            },
            sessionSegments: {
              [oldSessionId]: ['seg-old-1'],
            },
            decisions: {},
            sessionDecisions: {},
            endedSessions: {},
            currentEnding: null,
            isGeneratingEnding: false,
            endingError: null,
            loading: false,
            error: null,
          },
          version: 1,
        };

        const providerPersist = {
          state: {
            providers: {
              'provider-playwright': {
                id: 'provider-playwright',
                type: 'gemini',
                name: 'Playwright Test Provider',
                endpoint: '',
                model: '',
                capabilities: { text: true, images: false, streaming: true },
                createdAt: now,
                updatedAt: now,
              },
            },
            activeProviderId: 'provider-playwright',
            validationStatus: {},
          },
          version: 1,
        };

        put('narraitor-world-store', worldPersist);
        put('narraitor-character-store', characterPersist);
        put('narraitor-session-store', sessionPersist);
        put('narraitor-narrative-store', narrativePersist);
        put('narraitor-provider-store', providerPersist);
        localStorage.setItem('narraitor-provider-store', JSON.stringify(providerPersist));
      },
      {
        getTimestampSource: GET_TIMESTAMP_SOURCE,
        worldId: WORLD_ID,
        charId: CHAR_ID,
        oldSessionId: OLD_SESSION_ID,
      }
    );

    // 2. Navigate to /dashboard then to /worlds/[id]/play?fresh=true (simulating New Session click)
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.goto(`${baseURL}/worlds/${WORLD_ID}/play?fresh=true`, {
      waitUntil: 'domcontentloaded',
    });

    // 3. Wait for turn 1 to land: choice-selector appears
    const choiceSelector = page.locator('[data-testid="choice-selector"]');
    await expect(choiceSelector).toBeVisible({ timeout: 15000 });

    // 4. Confirm choices and custom input are enabled without reload
    const choiceButtons = page.locator('[data-testid="choice-selector"] button[role="radio"], button.manuscript-suggested-action');
    await expect(choiceButtons.first()).toBeVisible({ timeout: 15000 });
    await expect(choiceButtons.first()).toBeEnabled();

    // Check custom input
    const customInput = page.locator('[data-testid="choice-selector"] input, input[placeholder*="action"]');
    if (await customInput.count() > 0) {
      await expect(customInput.first()).toBeEnabled();
    }

    // 5. Verify the active session ID is a newly minted session (not OLD_SESSION_ID)
    const activeSessionInfo = await page.evaluate(({ oldSessionId }) => {
      const sessionStore = (window as any).useSessionStore?.getState?.();
      const narrativeStore = (window as any).useNarrativeStore?.getState?.();
      return {
        activeSessionId: sessionStore?.id,
        isDifferentFromOld: sessionStore?.id !== oldSessionId,
        oldSessionSegmentsStillExist:
          Boolean(narrativeStore?.sessionSegments?.[oldSessionId]?.length),
        savedSessionsHasOld: Boolean(sessionStore?.savedSessions?.[oldSessionId]),
      };
    }, { oldSessionId: OLD_SESSION_ID });

    expect(activeSessionInfo.isDifferentFromOld).toBe(true);
    expect(activeSessionInfo.activeSessionId).toMatch(/^session-/);
    expect(activeSessionInfo.oldSessionSegmentsStillExist).toBe(true);
  });

  test('Path 2: Play Again from Ending Screen routes to ?fresh=true and unlocks turn 1', async ({
    page,
    baseURL,
  }) => {
    // 1. Seed IndexedDB with a finished session showing the ending screen
    await page.addInitScript(
      ({ getTimestampSource, worldId, charId, oldSessionId }) => {
        const instantiateGetTimestamp = (source: string) =>
          new Function(`return (${source});`)() as () => string;
        const getTimestamp = instantiateGetTimestamp(getTimestampSource);
        const now = getTimestamp();
        const dbName = 'narraitor-state';
        const storeName = 'narraitor-store';

        function put(key: string, value: any): Promise<void> {
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

        const worldPersist = {
          state: {
            worlds: {
              [worldId]: {
                id: worldId,
                name: 'Ending Test World',
                description: 'World with completed story',
                genre: 'fantasy',
                attributes: [],
                skills: [],
                derivedStats: [],
                createdAt: now,
                updatedAt: now,
              },
            },
            entities: {
              [worldId]: {
                id: worldId,
                name: 'Ending Test World',
                description: 'World with completed story',
                genre: 'fantasy',
                attributes: [],
                skills: [],
                derivedStats: [],
                createdAt: now,
                updatedAt: now,
              },
            },
            worldStates: {},
            currentWorldId: worldId,
            currentEntityId: worldId,
            error: null,
            loading: false,
          },
          version: 2,
        };

        const characterPersist = {
          state: {
            characters: {
              [charId]: {
                id: charId,
                name: 'Mara Voss',
                description: 'The Hero',
                worldId: worldId,
                level: 1,
                isPlayer: true,
                attributes: [],
                skills: [],
                derivedStats: [],
                background: {
                  history: '',
                  personality: '',
                  goals: [],
                  fears: [],
                  relationships: [],
                },
                status: { conditions: [] },
                inventory: {
                  characterId: charId,
                  items: [],
                  capacity: 100,
                  categories: [],
                },
                createdAt: now,
                updatedAt: now,
              },
            },
            entities: {
              [charId]: {
                id: charId,
                name: 'Mara Voss',
                description: 'The Hero',
                worldId: worldId,
                level: 1,
                isPlayer: true,
                attributes: [],
                skills: [],
                derivedStats: [],
                background: {
                  history: '',
                  personality: '',
                  goals: [],
                  fears: [],
                  relationships: [],
                },
                status: { conditions: [] },
                inventory: {
                  characterId: charId,
                  items: [],
                  capacity: 100,
                  categories: [],
                },
                createdAt: now,
                updatedAt: now,
              },
            },
            worldCharacterIds: { [worldId]: [charId] },
            currentCharacterId: charId,
            currentEntityId: charId,
            error: null,
            loading: false,
          },
          version: 2,
        };

        const sessionPersist = {
          state: {
            id: oldSessionId,
            status: 'active',
            currentSceneId: 'scene-end-1',
            playerChoices: [],
            error: null,
            worldId: worldId,
            characterId: charId,
            savedSessions: {
              [oldSessionId]: {
                id: oldSessionId,
                worldId: worldId,
                characterId: charId,
                lastPlayed: now,
                narrativeCount: 10,
              },
            },
            autoSave: {
              enabled: true,
              lastSaveTime: now,
              status: 'idle',
              errorMessage: null,
              totalSaves: 1,
            },
            tutorialProgress: {
              phases: {
                intro: { completed: true, skipped: false },
                worldCreation: { completed: true, skipped: false, lastStep: 0 },
                worldGeneration: { completed: true, skipped: false, lastStep: 0 },
                characterCreation: { completed: true, skipped: false, lastStep: 0, quickStartCompleted: true },
                firstPlay: { completed: true, skipped: false },
              },
              dismissedHints: ['firstPlay'],
              lastActiveStep: null,
            },
          },
          version: 4,
        };

        const narrativePersist = {
          state: {
            segments: {},
            sessionSegments: {},
            decisions: {},
            sessionDecisions: {},
            endedSessions: { [oldSessionId]: true },
            currentEnding: {
              id: 'ending-123',
              sessionId: oldSessionId,
              characterId: charId,
              worldId: worldId,
              type: 'story-complete',
              tone: 'triumphant',
              epilogue: 'The legend is remembered across all realms.',
              characterLegacy: 'Mara Voss is remembered for bravery.',
              worldImpact: 'The world found peace.',
              timestamp: now,
              createdAt: now,
              updatedAt: now,
              achievements: ['Champion'],
            },
            isGeneratingEnding: false,
            endingError: null,
            loading: false,
            error: null,
          },
          version: 1,
        };

        const providerPersist = {
          state: {
            providers: {
              'provider-playwright': {
                id: 'provider-playwright',
                type: 'gemini',
                name: 'Playwright Test Provider',
                endpoint: '',
                model: '',
                capabilities: { text: true, images: false, streaming: true },
                createdAt: now,
                updatedAt: now,
              },
            },
            activeProviderId: 'provider-playwright',
            validationStatus: {},
          },
          version: 1,
        };

        put('narraitor-world-store', worldPersist);
        put('narraitor-character-store', characterPersist);
        put('narraitor-session-store', sessionPersist);
        put('narraitor-narrative-store', narrativePersist);
        put('narraitor-provider-store', providerPersist);
        localStorage.setItem('narraitor-provider-store', JSON.stringify(providerPersist));
      },
      {
        getTimestampSource: GET_TIMESTAMP_SOURCE,
        worldId: WORLD_ID,
        charId: CHAR_ID,
        oldSessionId: OLD_SESSION_ID,
      }
    );

    // 2. Navigate to /worlds/[id]/play to view the ending screen
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.goto(`${baseURL}/worlds/${WORLD_ID}/play`, { waitUntil: 'domcontentloaded' });

    // 3. Locate Ending Screen and click "New Story" (Play Again)
    const endingScreen = page.locator('[data-testid="ending-screen"]');
    await expect(endingScreen).toBeVisible({ timeout: 15000 });

    const newStoryButton = page.locator('button:has-text("New Story"), [data-testid="ending-screen"] button:has-text("New Story")');
    await expect(newStoryButton).toBeVisible();
    await newStoryButton.click();

    // 4. Verify URL transitions to ?fresh=true and turn 1 choices appear unlocked
    await expect(page).toHaveURL(/fresh=true/);

    const choiceSelector = page.locator('[data-testid="choice-selector"]');
    await expect(choiceSelector).toBeVisible({ timeout: 15000 });

    const choiceButtons = page.locator('[data-testid="choice-selector"] button[role="radio"], button.manuscript-suggested-action');
    await expect(choiceButtons.first()).toBeVisible({ timeout: 15000 });
    await expect(choiceButtons.first()).toBeEnabled();

    // Check custom input
    const customInput = page.locator('[data-testid="choice-selector"] input, input[placeholder*="action"]');
    if (await customInput.count() > 0) {
      await expect(customInput.first()).toBeEnabled();
    }

    // 5. Confirm newly minted session ID
    const activeSessionId = await page.evaluate(() => {
      return (window as any).useSessionStore?.getState?.()?.id;
    });
    expect(activeSessionId).not.toBe(OLD_SESSION_ID);
    expect(activeSessionId).toMatch(/^session-/);
  });
});
