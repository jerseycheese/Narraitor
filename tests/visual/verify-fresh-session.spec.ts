import { test, expect } from '@playwright/test';
import { getTimestamp } from '@/lib/utils';
import { mockApiEndpoints } from './utils/mockApi';

const GET_TIMESTAMP_SOURCE = getTimestamp.toString();

// Targeted smoke check for fresh-session skeleton → content transition.
// Assumes dev server is available at baseURL (default http://localhost:3000).
//
// This is the one /play spec that intentionally exercises the live generation
// path (isPlaywrightEnv() stays false here so NarrativeController generates the
// first scene instead of waiting for seeded segments). It must mock the AI
// endpoints — otherwise the fresh-generation + journal-summarize calls hit the
// real routes, hang the single CI dev server, and time out unrelated specs in
// the other worker (#1342). Mocks keep the skeleton→content transition this test
// checks, just deterministically.
//
// DS coverage (#1264): single-theme (default DS1) by design — this verifies the
// skeleton -> active-session content *transition* behaviour, not theme layout.
// The play surface's per-theme visuals are covered by
// tests/visual/session-themes.spec.ts and design-system-session.spec.ts.

test.describe('Fresh GameSession skeleton → content', () => {
  test('shows skeleton, then reveals active session with choices', async ({
    page,
    baseURL,
  }) => {
    // Capture console logs to help debug skeleton transitions
    const logs: string[] = [];
    page.on('console', (msg) => {
      const txt = msg.text();
      if (
        txt.includes('[GameSession]') ||
        txt.includes('[ActiveGameSession]') ||
        txt.includes('[NarrativeController]')
      ) {
        logs.push(txt);
      }
    });
    // Intercept AI routes so fresh generation + journal summarize are mocked,
    // not live (see file header / #1342).
    await mockApiEndpoints(page);

    const path =
      '/worlds/world_8b927b31-f6d0-4e17-8391-74033dd8323a/play?fresh=true';
    // Seed IndexedDB before any app script runs to avoid hydration overwrites
    await page.addInitScript(
      ({ getTimestampSource }) => {
        const instantiateGetTimestamp = (source: string) =>
          new Function(`return (${source});`)() as () => string;
        const getTimestamp = instantiateGetTimestamp(getTimestampSource);
        const WORLD_ID = 'world_8b927b31-f6d0-4e17-8391-74033dd8323a';
        const CHAR_ID = 'char-playwright-e2e';
        const now = getTimestamp();
        const dbName = 'narraitor-state';
        const storeName = 'narraitor-store';

        function put(key: string, value: any): Promise<void> {
          return new Promise((resolve) => {
            const open = indexedDB.open(dbName, 1);
            open.onupgradeneeded = () => {
              const db = open.result;
              if (!db.objectStoreNames.contains(storeName))
                db.createObjectStore(storeName);
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
              [WORLD_ID]: {
                id: WORLD_ID,
                name: 'Playwright Test World',
                description: 'Seeded world for fresh-session test',
                genre: 'fantasy',
                attributes: [],
                skills: [],
                derivedStats: [],
                createdAt: now,
                updatedAt: now,
              },
            },
            entities: {
              [WORLD_ID]: {
                id: WORLD_ID,
                name: 'Playwright Test World',
                description: 'Seeded world for fresh-session test',
                genre: 'fantasy',
                attributes: [],
                skills: [],
                derivedStats: [],
                createdAt: now,
                updatedAt: now,
              },
            },
            worldStates: {
              [WORLD_ID]: {
                worldId: WORLD_ID,
                version: 0,
                lastModified: now,
                npcRelationships: {},
                majorEvents: [],
                playerCharacterThreads: {},
                characterRelationships: {},
              },
            },
            currentWorldId: WORLD_ID,
            currentEntityId: WORLD_ID,
            error: null,
            loading: false,
          },
          version: 2,
        } as const;

        const characterPersist = {
          state: {
            characters: {
              [CHAR_ID]: {
                id: CHAR_ID,
                name: 'E2E Hero',
                description: 'Playwright seeded character',
                worldId: WORLD_ID,
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
                  characterId: CHAR_ID,
                  items: [],
                  capacity: 100,
                  categories: [],
                },
                createdAt: now,
                updatedAt: now,
              },
            },
            entities: {
              [CHAR_ID]: {
                id: CHAR_ID,
                name: 'E2E Hero',
                description: 'Playwright seeded character',
                worldId: WORLD_ID,
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
                  characterId: CHAR_ID,
                  items: [],
                  capacity: 100,
                  categories: [],
                },
                createdAt: now,
                updatedAt: now,
              },
            },
            worldCharacterIds: {
              [WORLD_ID]: [CHAR_ID],
            },
            currentCharacterId: CHAR_ID,
            currentEntityId: CHAR_ID,
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
            autoSave: {
              enabled: true,
              lastSaveTime: null,
              status: 'idle',
              errorMessage: null,
              totalSaves: 0,
            },
            onboardingCompleted: false,
          },
          version: 2,
        } as const;

        put('narraitor-world-store', worldPersist);
        put('narraitor-character-store', characterPersist);
        put('narraitor-session-store', sessionPersist);
      },
      { getTimestampSource: GET_TIMESTAMP_SOURCE }
    );
    // First navigate to the app home to seed stores via localStorage.
    // /dashboard (not /) since #1528: the root is the public landing page and
    // routes browsers with seeded IndexedDB state to /dashboard anyway.
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });

    // Seed minimal world + character using dev-exposed stores (IndexedDB-backed)
    await page.evaluate(
      ({ getTimestampSource }) => {
        const instantiateGetTimestamp = (source: string) =>
          new Function(`return (${source});`)() as () => string;
        const getTimestamp = instantiateGetTimestamp(getTimestampSource);
        const WORLD_ID = 'world_8b927b31-f6d0-4e17-8391-74033dd8323a';
        const CHAR_ID = 'char-playwright-e2e';
        const now = getTimestamp();

        // Ensure world
        const worldHook = (window as any).useWorldStore;
        if (worldHook?.setState) {
          const world = {
            id: WORLD_ID,
            name: 'Playwright Test World',
            description: 'Seeded world for fresh-session test',
            genre: 'fantasy',
            attributes: [],
            skills: [],
            derivedStats: [],
            createdAt: now,
            updatedAt: now,
          };
          worldHook.setState((prev: any) => ({
            worlds: { ...(prev?.worlds || {}), [WORLD_ID]: world },
            entities: { ...(prev?.entities || {}), [WORLD_ID]: world },
            worldStates: {
              ...(prev?.worldStates || {}),
              [WORLD_ID]: {
                worldId: WORLD_ID,
                version: 0,
                lastModified: now,
                npcRelationships: {},
                majorEvents: [],
                playerCharacterThreads: {},
                characterRelationships: {},
              },
            },
            currentWorldId: WORLD_ID,
            currentEntityId: WORLD_ID,
            error: null,
            loading: false,
          }));
        }

        // Ensure character
        const charHook = (window as any).useCharacterStore;
        if (charHook?.setState) {
          const character = {
            id: CHAR_ID,
            name: 'E2E Hero',
            description: 'Playwright seeded character',
            worldId: WORLD_ID,
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
              characterId: CHAR_ID,
              items: [],
              capacity: 100,
              categories: [],
            },
            createdAt: now,
            updatedAt: now,
          };
          charHook.setState((prev: any) => ({
            characters: { ...(prev?.characters || {}), [CHAR_ID]: character },
            entities: { ...(prev?.entities || {}), [CHAR_ID]: character },
            worldCharacterIds: {
              ...(prev?.worldCharacterIds || {}),
              [WORLD_ID]: Array.from(
                new Set([
                  ...(prev?.worldCharacterIds?.[WORLD_ID] || []),
                  CHAR_ID,
                ])
              ),
            },
            currentCharacterId: CHAR_ID,
            currentEntityId: CHAR_ID,
            error: null,
            loading: false,
          }));
        }

        // Reset session store to initializing for a fresh start
        const sessionHook = (window as any).useSessionStore;
        if (sessionHook?.setState) {
          sessionHook.setState((prev: any) => ({
            ...prev,
            id: null,
            status: 'initializing',
            currentSceneId: null,
            playerChoices: [],
            error: null,
            worldId: null,
            characterId: null,
          }));
        }
      },
      { getTimestampSource: GET_TIMESTAMP_SOURCE }
    );

    // Now navigate to the target fresh-session URL
    await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded' });

    // Seed again on the target page to avoid any late hydration races
    await page.evaluate(
      ({ getTimestampSource }) => {
        const instantiateGetTimestamp = (source: string) =>
          new Function(`return (${source});`)() as () => string;
        const getTimestamp = instantiateGetTimestamp(getTimestampSource);
        const WORLD_ID = 'world_8b927b31-f6d0-4e17-8391-74033dd8323a';
        const CHAR_ID = 'char-playwright-e2e';
        const now = getTimestamp();

        const worldHook = (window as any).useWorldStore;
        if (worldHook?.setState) {
          const world = {
            id: WORLD_ID,
            name: 'Playwright Test World',
            description: 'Seeded world for fresh-session test',
            genre: 'fantasy',
            attributes: [],
            skills: [],
            derivedStats: [],
            createdAt: now,
            updatedAt: now,
          };
          worldHook.setState((prev: any) => ({
            worlds: { ...(prev?.worlds || {}), [WORLD_ID]: world },
            currentWorldId: WORLD_ID,
            error: null,
            loading: false,
          }));
        }

        const charHook = (window as any).useCharacterStore;
        if (charHook?.setState) {
          const character = {
            id: CHAR_ID,
            name: 'E2E Hero',
            description: 'Playwright seeded character',
            worldId: WORLD_ID,
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
              characterId: CHAR_ID,
              items: [],
              capacity: 100,
              categories: [],
            },
            createdAt: now,
            updatedAt: now,
          };
          charHook.setState((prev: any) => ({
            characters: { ...(prev?.characters || {}), [CHAR_ID]: character },
            currentCharacterId: CHAR_ID,
            error: null,
            loading: false,
          }));
        }

        const sessionHook = (window as any).useSessionStore;
        if (sessionHook?.setState) {
          sessionHook.setState((prev: any) => ({
            ...prev,
            id: null,
            status: 'initializing',
            currentSceneId: null,
            playerChoices: [],
            error: null,
            worldId: null,
            characterId: null,
          }));
        }
      },
      { getTimestampSource: GET_TIMESTAMP_SOURCE }
    );

    // Ensure we are not on the "World Not Found" error path
    await page.reload({ waitUntil: 'domcontentloaded' });

    // If still world-not-found, retry reseed + reload once more
    const worldNotFound = page.getByText('World Not Found');
    const worldNotFoundVisible = await worldNotFound.isVisible().catch((error) => {
      console.log(`Error checking worldNotFound visibility: ${(error as Error).message}`);
      return false;
    });
    if (worldNotFoundVisible) {
      await page.evaluate(
        ({ getTimestampSource }) => {
          const instantiateGetTimestamp = (source: string) =>
            new Function(`return (${source});`)() as () => string;
          const getTimestamp = instantiateGetTimestamp(getTimestampSource);
          const WORLD_ID = 'world_8b927b31-f6d0-4e17-8391-74033dd8323a';
          const worldHook = (window as any).useWorldStore;
          if (worldHook?.setState) {
            worldHook.setState((prev: any) => ({
              worlds: {
                ...(prev?.worlds || {}),
                [WORLD_ID]: prev?.worlds?.[WORLD_ID] || {
                  id: WORLD_ID,
                  name: 'Playwright Test World',
                  description: 'Seeded world for fresh-session test',
                  genre: 'fantasy',
                  attributes: [],
                  skills: [],
                  derivedStats: [],
                  createdAt: getTimestamp(),
                  updatedAt: getTimestamp(),
                },
              },
              currentWorldId: WORLD_ID,
              error: null,
              loading: false,
            }));
          }
        },
        { getTimestampSource: GET_TIMESTAMP_SOURCE }
      );
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
    await expect(worldNotFound).toHaveCount(0);

    // Click the in-page Start Session button (most reliable to start a session)
    const startSession = page.getByRole('button', { name: /start session/i });
    const startSessionVisible = await startSession.isVisible().catch((error) => {
      console.log(`Error checking start session visibility: ${(error as Error).message}`);
      return false;
    });
    if (startSessionVisible) {
      await startSession.click();
    }

    // Ensure legacy loading text isn't persistent
    await expect(page.getByText('Loading your game...')).toHaveCount(0);

    // Skeleton should appear briefly
    const skeleton = page.locator('[data-testid="game-session-skeleton"]');
    try {
      await skeleton.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      console.log('Skeleton did not appear - app initialized too quickly');
    }

    // Then the active session container should become visible (allow time for AI/fallback)
    await page
      .locator('[data-testid="manuscript-session-shell"]')
      .waitFor({ state: 'visible', timeout: 20000 })
      .catch(async (e) => {
        // Attach logs to help diagnose
        console.log('--- Debug logs ---');
        for (const l of logs) console.log(l);
        throw e;
      });

    // Assert on the rendered prose rather than on the narrative store. The
    // header above explains why isPlaywrightEnv() has to stay false here, and
    // in a production build that's the same flag that publishes stores on
    // `window` — so reading the store would cost the live generation path this
    // spec exists to exercise. Prose on screen proves segments arrived, and it
    // proves it the way a player would see it.
    const narrativeProse = page
      .locator(
        '[data-testid="manuscript-session-shell"] [data-testid="narrative-content-container"]'
      )
      .first();
    try {
      await expect(narrativeProse).toBeVisible({ timeout: 20000 });
      await expect(narrativeProse).not.toBeEmpty();
    } catch (e) {
      console.log('--- Debug logs ---');
      for (const l of logs) console.log(l);
      throw e;
    }

    // Choices panel should render (selector or skeleton fallback while choices load)
    const choiceSelector = page.locator('[data-testid="choice-selector"]');
    const choiceFallback = page.locator('#choices-container .player-choices-container');
    await page.waitForFunction(
      () =>
        Boolean(
          document.querySelector('[data-testid="choice-selector"]') ||
            document.querySelector('#choices-container .player-choices-container')
        ),
      // waitForFunction's signature is (fn, arg, options) — a timeout in the
      // second slot gets serialized as the page-function argument and the call
      // quietly falls back to the default action timeout.
      undefined,
      { timeout: 10000 }
    );
    const hasChoices = await choiceSelector.isVisible();
    if (!hasChoices) {
      await expect(choiceFallback).toBeVisible({ timeout: 10000 });
    }

    // Optional: click the first visible choice to confirm interactivity
    if (await choiceSelector.isVisible()) {
      const firstChoice = page.locator('[data-testid^="choice-option-"]').first();
      if (await firstChoice.isVisible()) {
        await firstChoice.click();
      }
    }
  });
});
