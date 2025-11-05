import { Page } from '@playwright/test';
import {
  SAMPLE_WORLDS,
  SAMPLE_CHARACTERS,
  SAMPLE_GAME_SESSIONS,
  SAMPLE_NARRATIVE_SEGMENTS,
  SAMPLE_DECISIONS,
} from '@/tests/fixtures';

/**
 * Base seeding for empty state tests - minimal data needed for app initialization
 */
export async function seedBaseData(page: Page): Promise<void> {
  console.log('Seeding base data for empty state tests...');

  await page.addInitScript(async () => {
    // Clear any existing data to ensure true empty state
    localStorage.clear();

    // Seed empty stores to ensure app reads empty state
    const seedStore = async (key: string, value: Record<string, unknown>) => {
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
    const emptyStores = {
      world: {
        state: { worlds: {}, currentWorldId: null, error: null, loading: false },
        version: 1,
      },
      character: {
        state: { characters: {}, currentCharacterId: null, error: null, loading: false },
        version: 1,
      },
      session: {
        state: {
          sessions: {},
          currentSessionId: null,
          savedSessions: {},
          onboardingCompleted: false,
          error: null,
          loading: false,
        },
        version: 2,
      },
      narrative: {
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
          loading: false,
        },
        version: 1,
      },
      journal: {
        state: { entries: {}, sessionEntries: {} },
        version: 1,
      },
    };

    // Seed IndexedDB (primary) and localStorage (fallback)
    await Promise.all([
      seedStore('narraitor-world-store', emptyStores.world),
      seedStore('narraitor-character-store', emptyStores.character),
      seedStore('narraitor-session-store', emptyStores.session),
      seedStore('narraitor-narrative-store', emptyStores.narrative),
      seedStore('narraitor-journal-store', emptyStores.journal),
    ]);

    Object.entries(emptyStores).forEach(([name, data]) => {
      localStorage.setItem(`narraitor-${name}-store`, JSON.stringify(data));
    });

    (window as any).__TEST_SEEDED__ = true;
    console.log('✅ Base data seeded for empty state');
  });
}

/**
 * Full data seeding for populated state tests
 * Simplified approach with single seeding strategy
 */
export async function seedTestData(page: Page): Promise<void> {
  console.log('Seeding full test data for populated state tests...');

  // Flag Playwright runtime
  await page.addInitScript(() => {
    (window as typeof window & { __PLAYWRIGHT__?: boolean }).__PLAYWRIGHT__ = true;
  });

  // Use addInitScript to set data BEFORE the app loads
  await page.addInitScript(
    async ({ testData }) => {
      const {
        SAMPLE_WORLDS,
        SAMPLE_CHARACTERS,
        SAMPLE_GAME_SESSIONS,
        SAMPLE_NARRATIVE_SEGMENTS,
        SAMPLE_DECISIONS,
      } = testData;

      // Single unified seeding helper
      const seedStore = async (key: string, value: Record<string, unknown>) => {
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

      // Convert arrays to Record format
      const worldsRecord = SAMPLE_WORLDS.reduce(
        (acc: Record<string, any>, world: any) => {
          acc[world.id] = world;
          return acc;
        },
        {}
      );

      const charactersRecord = SAMPLE_CHARACTERS.reduce(
        (acc: Record<string, any>, char: any) => {
          acc[char.id] = char;
          return acc;
        },
        {}
      );

      const sessionsRecord = SAMPLE_GAME_SESSIONS.reduce(
        (acc: Record<string, any>, session: any) => {
          acc[session.id] = session;
          return acc;
        },
        {}
      );

      const segmentsRecord = SAMPLE_NARRATIVE_SEGMENTS.reduce<Record<string, any>>(
        (acc: Record<string, any>, segment: any) => {
          acc[segment.id] = segment;
          return acc;
        },
        {}
      );

      const decisionsRecord = SAMPLE_DECISIONS.reduce<Record<string, any>>(
        (acc: Record<string, any>, decision: any) => {
          acc[decision.id] = decision;
          return acc;
        },
        {}
      );

      // Prepare store data
      const storeData = {
        world: {
          state: {
            worlds: worldsRecord,
            currentWorldId: SAMPLE_WORLDS[0]?.id || null,
            error: null,
            loading: false,
          },
          version: 1,
        },
        character: {
          state: {
            characters: charactersRecord,
            currentCharacterId: SAMPLE_CHARACTERS[0]?.id || null,
            error: null,
            loading: false,
          },
          version: 1,
        },
        session: {
          state: {
            sessions: sessionsRecord,
            currentSessionId: SAMPLE_GAME_SESSIONS[0]?.id || null,
            id: SAMPLE_GAME_SESSIONS[0]?.id || null,
            status: 'active' as const,
            worldId: SAMPLE_GAME_SESSIONS[0]?.worldId,
            characterId: SAMPLE_GAME_SESSIONS[0]?.characterId,
            savedSessions: SAMPLE_GAME_SESSIONS.reduce<Record<string, any>>(
              (acc: Record<string, any>, session: any) => {
                acc[session.id] = {
                  id: session.id,
                  worldId: session.worldId,
                  characterId: session.characterId,
                  lastPlayed: session.lastPlayedAt,
                  narrativeCount: session.totalTurns,
                };
                return acc;
              },
              {}
            ),
            onboardingCompleted: true,
            error: null,
            loading: false,
          },
          version: 2,
        },
        narrative: {
          state: {
            segments: segmentsRecord,
            sessionSegments: SAMPLE_GAME_SESSIONS.reduce<Record<string, string[]>>(
              (acc: Record<string, string[]>, session: any) => {
                acc[session.id] = Object.keys(segmentsRecord).filter(
                  (id) => segmentsRecord[id]?.sessionId === session.id
                );
                return acc;
              },
              {}
            ),
            decisions: decisionsRecord,
            sessionDecisions: SAMPLE_GAME_SESSIONS.reduce<Record<string, string[]>>(
              (acc: Record<string, string[]>, session: any) => {
                acc[session.id] = Object.keys(decisionsRecord).filter((id) => {
                  const decision = decisionsRecord[id];
                  return decision?.narrativeSegmentId?.includes(
                    session.id.split('-')[1]
                  );
                });
                return acc;
              },
              {}
            ),
            endedSessions: {},
            currentEnding: null,
            isGeneratingEnding: false,
            endingError: null,
            error: null,
            loading: false,
          },
          version: 1,
        },
        journal: {
          state: { entries: {}, sessionEntries: {} },
          version: 1,
        },
      };

      // Seed IndexedDB (primary) and localStorage (fallback)
      await Promise.all([
        seedStore('narraitor-world-store', storeData.world),
        seedStore('narraitor-character-store', storeData.character),
        seedStore('narraitor-session-store', storeData.session),
        seedStore('narraitor-narrative-store', storeData.narrative),
        seedStore('narraitor-journal-store', storeData.journal),
      ]);

      Object.entries(storeData).forEach(([name, data]) => {
        localStorage.setItem(`narraitor-${name}-store`, JSON.stringify(data));
      });

      // Store test data globally for access
      (window as any).__TEST_WORLDS__ = worldsRecord;
      (window as any).__TEST_CHARACTERS__ = charactersRecord;
      (window as any).__TEST_SESSIONS__ = sessionsRecord;
      (window as any).__TEST_SEGMENTS__ = segmentsRecord;
      (window as any).__TEST_DECISIONS__ = decisionsRecord;
      (window as any).__TEST_SEEDED__ = true;

      console.log('✅ Full test data seeded');
    },
    {
      testData: {
        SAMPLE_WORLDS,
        SAMPLE_CHARACTERS,
        SAMPLE_GAME_SESSIONS,
        SAMPLE_NARRATIVE_SEGMENTS,
        SAMPLE_DECISIONS,
      },
    }
  );

  console.log('✅ Full test data seeded via addInitScript');
}
