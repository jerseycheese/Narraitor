import { test, expect } from '@playwright/test';
import { getTimestamp } from '@/lib/utils';

const GET_TIMESTAMP_SOURCE = getTimestamp.toString();

// Targeted smoke check for fresh-session skeleton → content transition.
// Assumes dev server is available at baseURL (default http://localhost:3000).

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
    const path =
      '/worlds/world_8b927b31-f6d0-4e17-8391-74033dd8323a/play?fresh=true';
    // Seed IndexedDB before any app script runs to avoid hydration overwrites
    await page.addInitScript(({ getTimestampSource }) => {
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
              createdAt: now,
              updatedAt: now,
            },
          },
          currentWorldId: WORLD_ID,
          error: null,
          loading: false,
        },
        version: 1,
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
              background: {
                history: '',
                personality: '',
                goals: [],
                fears: [],
                relationships: [],
              },
              status: { health: 100, maxHealth: 100, conditions: [] },
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
          currentCharacterId: CHAR_ID,
          error: null,
          loading: false,
        },
        version: 1,
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
          onboardingCompleted: false,
        },
        version: 2,
      } as const;

      put('narraitor-world-store', worldPersist);
      put('narraitor-character-store', characterPersist);
      put('narraitor-session-store', sessionPersist);
    }, { getTimestampSource: GET_TIMESTAMP_SOURCE });
    // First navigate to the app root to seed stores via localStorage
    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });

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
            background: {
              history: '',
              personality: '',
              goals: [],
              fears: [],
              relationships: [],
            },
            status: { health: 100, maxHealth: 100, conditions: [] },
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
            background: {
              history: '',
              personality: '',
              goals: [],
              fears: [],
              relationships: [],
            },
            status: { health: 100, maxHealth: 100, conditions: [] },
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
    if (await worldNotFound.isVisible().catch(() => false)) {
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
    if (await startSession.isVisible().catch(() => false)) {
      await startSession.click();
    }

    // Ensure legacy loading text isn't persistent
    await expect(page.getByText('Loading your game...')).toHaveCount(0);

    // Skeleton should appear briefly
    const skeleton = page.locator('[data-testid="game-session-skeleton"]');
    await skeleton
      .first()
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => {});

    // Then the active session container should become visible (allow time for AI/fallback)
    await page
      .locator('[data-testid="game-session-active"]')
      .waitFor({ state: 'visible', timeout: 20000 })
      .catch(async (e) => {
        // Attach logs to help diagnose
        console.log('--- Debug logs ---');
        for (const l of logs) console.log(l);
        throw e;
      });

    // Choices panel must be visible
    await expect(page.locator('[data-testid="choice-selector"]')).toBeVisible();

    // Optional: click the first visible choice to confirm interactivity
    const firstChoice = page.locator('[data-testid^="choice-option-"]').first();
    if (await firstChoice.isVisible().catch(() => false)) {
      await firstChoice.click();
    }
  });
});
