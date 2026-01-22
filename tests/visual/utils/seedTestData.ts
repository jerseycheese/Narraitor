import { Page } from '@playwright/test';
import {
  SAMPLE_WORLDS,
  SAMPLE_CHARACTERS,
  SAMPLE_GAME_SESSIONS,
  SAMPLE_NARRATIVE_SEGMENTS,
  SAMPLE_DECISIONS,
  SAMPLE_JOURNAL_ENTRIES,
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
        SAMPLE_JOURNAL_ENTRIES,
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

      const journalEntriesRecord = (SAMPLE_JOURNAL_ENTRIES || []).reduce(
        (acc: Record<string, any>, entry: any) => {
          acc[entry.id] = entry;
          return acc;
        },
        {}
      );

      const journalSessionEntries = Object.values(journalEntriesRecord).reduce(
        (acc: Record<string, string[]>, entry: any) => {
          if (!entry?.sessionId) return acc;
          acc[entry.sessionId] = acc[entry.sessionId] || [];
          acc[entry.sessionId].push(entry.id);
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
          state: { entries: journalEntriesRecord, sessionEntries: journalSessionEntries },
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
      (window as any).__TEST_JOURNAL_ENTRIES__ = journalEntriesRecord;
      (window as any).__TEST_SEEDED__ = true;

      const seedStoresFromFixtures = () => {
        const testWindow = window as typeof window & {
          __TEST_STORES_SEEDED__?: boolean;
          __TEST_JOURNAL_SEEDED__?: boolean;
          useWorldStore?: { setState?: (updater: any) => void };
          useCharacterStore?: { setState?: (updater: any) => void };
          useSessionStore?: { setState?: (updater: any) => void };
          useNarrativeStore?: { setState?: (updater: any) => void };
          useJournalStore?: {
            setState?: (updater: any) => void;
            getState?: () => { entries?: Record<string, unknown>; sessionEntries?: Record<string, string[]> };
          };
        };

        if (testWindow.__TEST_STORES_SEEDED__) {
          return true;
        }

        const worldStore = testWindow.useWorldStore;
        const characterStore = testWindow.useCharacterStore;
        const sessionStore = testWindow.useSessionStore;
        const narrativeStore = testWindow.useNarrativeStore;
        const journalStore = testWindow.useJournalStore;

        if (!worldStore || !characterStore || !sessionStore) {
          return false;
        }

        const primaryWorldId = SAMPLE_WORLDS[0]?.id ?? Object.keys(worldsRecord)[0];
        const primaryCharacter =
          Object.values(charactersRecord).find((char: any) => char.worldId === primaryWorldId) ??
          Object.values(charactersRecord)[0];
        const primaryCharacterId = primaryCharacter?.id ?? SAMPLE_CHARACTERS[0]?.id;
        const primarySession =
          SAMPLE_GAME_SESSIONS.find(
            (session) =>
              session.worldId === primaryWorldId && session.characterId === primaryCharacterId
          ) ?? SAMPLE_GAME_SESSIONS[0];
        const primarySessionId = primarySession?.id ?? `session-${primaryWorldId}-${primaryCharacterId}`;

        const worldCharacterIds = Object.values(charactersRecord).reduce(
          (acc: Record<string, string[]>, char: any) => {
            if (!char?.worldId || !char?.id) return acc;
            acc[char.worldId] = acc[char.worldId] || [];
            if (!acc[char.worldId].includes(char.id)) {
              acc[char.worldId].push(char.id);
            }
            return acc;
          },
          {}
        );

        const savedSessions = SAMPLE_GAME_SESSIONS.reduce<Record<string, any>>(
          (acc, session) => {
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
        );

        const sessionSegmentIds = Object.values(segmentsRecord)
          .filter((segment: any) => segment?.sessionId === primarySessionId)
          .map((segment: any) => segment.id);

        const sessionDecisionIds = Object.values(decisionsRecord)
          .filter((decision: any) => {
            const segmentId = decision?.narrativeSegmentId;
            return segmentId && sessionSegmentIds.includes(segmentId);
          })
          .map((decision: any) => decision.id);

        worldStore.setState?.((state: any) => ({
          ...state,
          worlds: {
            ...state?.worlds,
            ...worldsRecord,
          },
          entities: {
            ...state?.entities,
            ...worldsRecord,
          },
          currentWorldId: primaryWorldId ?? state?.currentWorldId ?? null,
          currentEntityId: primaryWorldId ?? state?.currentEntityId ?? null,
          loading: false,
          error: null,
        }));

        characterStore.setState?.((state: any) => ({
          ...state,
          characters: {
            ...state?.characters,
            ...charactersRecord,
          },
          entities: {
            ...state?.entities,
            ...charactersRecord,
          },
          worldCharacterIds: {
            ...state?.worldCharacterIds,
            ...worldCharacterIds,
          },
          currentCharacterId: primaryCharacterId ?? state?.currentCharacterId ?? null,
          currentEntityId: primaryCharacterId ?? state?.currentEntityId ?? null,
          loading: false,
          error: null,
        }));

        sessionStore.setState?.((state: any) => ({
          ...state,
          savedSessions: Object.keys(state?.savedSessions || {}).length
            ? state.savedSessions
            : savedSessions,
          tutorialProgress: {
            phases: {
              intro: { completed: true, skipped: false },
              worldCreation: { completed: true, skipped: false, lastStep: 6 },
              worldGeneration: { completed: true, skipped: false, lastStep: 0 },
              characterCreation: { completed: true, skipped: false, lastStep: 5 },
              firstPlay: { completed: true, skipped: false },
            },
            dismissedHints: [],
            lastActiveStep: null,
          },
          id: primarySessionId ?? state?.id ?? null,
          currentSessionId: primarySessionId ?? state?.currentSessionId ?? null,
          worldId: primaryWorldId ?? state?.worldId ?? null,
          characterId: primaryCharacterId ?? state?.characterId ?? null,
          status: primarySession?.status ?? state?.status ?? 'active',
          error: null,
        }));

        narrativeStore?.setState?.((state: any) => ({
          ...state,
          segments: {
            ...state?.segments,
            ...segmentsRecord,
          },
          sessionSegments: {
            ...state?.sessionSegments,
            [primarySessionId]: sessionSegmentIds.length
              ? sessionSegmentIds
              : state?.sessionSegments?.[primarySessionId] ?? [],
          },
          decisions: {
            ...state?.decisions,
            ...decisionsRecord,
          },
          sessionDecisions: {
            ...state?.sessionDecisions,
            [primarySessionId]: sessionDecisionIds,
          },
        }));

        if (journalStore?.setState && Object.keys(journalEntriesRecord).length > 0) {
          journalStore.setState((state: any) => ({
            ...state,
            entries: { ...state?.entries, ...journalEntriesRecord },
            sessionEntries: {
              ...state?.sessionEntries,
              ...journalSessionEntries,
            },
            loading: false,
            error: null,
          }));
          testWindow.__TEST_JOURNAL_SEEDED__ = true;
        }

        testWindow.__TEST_STORES_SEEDED__ = true;
        return true;
      };

      const seedJournalStoreFromFixtures = () => {
        const testWindow = window as typeof window & {
          __TEST_JOURNAL_SEEDED__?: boolean;
          useJournalStore?: {
            setState?: (updater: any) => void;
            getState?: () => { sessionEntries?: Record<string, string[]> };
          };
        };

        if (testWindow.__TEST_JOURNAL_SEEDED__) {
          return true;
        }

        if (!Object.keys(journalEntriesRecord).length) {
          testWindow.__TEST_JOURNAL_SEEDED__ = true;
          return true;
        }

        const journalStore = testWindow.useJournalStore;
        if (!journalStore?.setState) {
          return false;
        }

        const primarySessionId =
          SAMPLE_GAME_SESSIONS[0]?.id ?? Object.keys(journalSessionEntries)[0];
        const existingEntries =
          journalStore.getState?.().sessionEntries?.[primarySessionId ?? ''] || [];

        if (existingEntries.length > 0) {
          testWindow.__TEST_JOURNAL_SEEDED__ = true;
          return true;
        }

        journalStore.setState((state: any) => ({
          ...state,
          entries: { ...state?.entries, ...journalEntriesRecord },
          sessionEntries: {
            ...state?.sessionEntries,
            ...journalSessionEntries,
          },
          loading: false,
          error: null,
        }));

        testWindow.__TEST_JOURNAL_SEEDED__ = true;
        return true;
      };

      const didSeedStores = seedStoresFromFixtures();
      if (!didSeedStores) {
        let attempts = 0;
        const maxAttempts = 50;
        const intervalId = window.setInterval(() => {
          attempts += 1;
          if (seedStoresFromFixtures() || attempts >= maxAttempts) {
            window.clearInterval(intervalId);
          }
        }, 100);
      }

      const didSeedJournalStore = seedJournalStoreFromFixtures();
      if (!didSeedJournalStore) {
        let attempts = 0;
        const maxAttempts = 50;
        const intervalId = window.setInterval(() => {
          attempts += 1;
          if (seedJournalStoreFromFixtures() || attempts >= maxAttempts) {
            window.clearInterval(intervalId);
          }
        }, 100);
      }

      console.log('✅ Full test data seeded');
    },
    {
      testData: {
        SAMPLE_WORLDS,
        SAMPLE_CHARACTERS,
        SAMPLE_GAME_SESSIONS,
        SAMPLE_NARRATIVE_SEGMENTS,
        SAMPLE_DECISIONS,
        SAMPLE_JOURNAL_ENTRIES,
      },
    }
  );

  console.log('✅ Full test data seeded via addInitScript');
}
