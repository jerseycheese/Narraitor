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
 * Flag the page as a Playwright runtime before any app script runs.
 *
 * Stores only publish themselves on `window` in a production build when this
 * flag is set (shouldExposeStoreOnWindow), so every seeder needs it — a spec
 * that skips it seeds fine against `next dev` and then hangs on hydration
 * against `next start`.
 */
async function flagPlaywrightRuntime(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as typeof window & { __PLAYWRIGHT__?: boolean }).__PLAYWRIGHT__ = true;
  });
}

/**
 * Base seeding for empty state tests - minimal data needed for app initialization
 */
export async function seedBaseData(page: Page): Promise<void> {
  console.log('Seeding base data for empty state tests...');

  await flagPlaywrightRuntime(page);

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
 * Barely-started seeding: one world, no characters, no sessions.
 *
 * Renders DashboardHome in its returning-no-session state — the only
 * state that puts the Getting Started step checklist (1/3 complete)
 * and the section interiors on screen. The completed intro phase is
 * what keeps DashboardHome from routing to GuidedFirstTimeExperience.
 */
export async function seedBarelyStartedData(page: Page): Promise<void> {
  console.log('Seeding barely-started data (one world, no characters/sessions)...');

  await flagPlaywrightRuntime(page);

  await page.addInitScript(
    async ({ world }) => {
      localStorage.clear();

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

      const stores = {
        world: {
          state: {
            worlds: { [world.id]: world },
            currentWorldId: world.id,
            error: null,
            loading: false,
          },
          version: 1,
        },
        character: {
          state: { characters: {}, currentCharacterId: null, error: null, loading: false },
          version: 1,
        },
        session: {
          state: {
            savedSessions: {},
            // intro complete -> isFirstTimeUser() is false -> DashboardHome
            // renders the dashboard instead of GuidedFirstTimeExperience.
            // Seeded at version 4 so the store skips its migrate() pass,
            // which would otherwise reset intro.completed to false.
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

      await Promise.all([
        seedStore('narraitor-world-store', stores.world),
        seedStore('narraitor-character-store', stores.character),
        seedStore('narraitor-session-store', stores.session),
        seedStore('narraitor-narrative-store', stores.narrative),
        seedStore('narraitor-journal-store', stores.journal),
      ]);

      Object.entries(stores).forEach(([name, data]) => {
        localStorage.setItem(`narraitor-${name}-store`, JSON.stringify(data));
      });

      (window as any).__TEST_SEEDED__ = true;
      console.log('✅ Barely-started data seeded');
    },
    { world: SAMPLE_WORLDS[0] }
  );
}

/**
 * Full data seeding for populated state tests
 * Simplified approach with single seeding strategy
 */
export async function seedTestData(page: Page): Promise<void> {
  console.log('Seeding full test data for populated state tests...');

  await flagPlaywrightRuntime(page);

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

      // Build NPC record: characters seeded as NPCs, with portrait.url exposed as avatarUrl
      const npcRecord = Object.fromEntries(
        Object.entries(charactersRecord).map(([id, char]: [string, any]) => [
          id,
          { ...char, avatarUrl: char.portrait?.url ?? undefined },
        ])
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
              seedStore('narraitor-npc-store', {
                state: { npcs: npcRecord, error: null, loading: false },
                version: 1,
              }),
            ]);

            Object.entries(storeData).forEach(([name, data]) => {
              localStorage.setItem(`narraitor-${name}-store`, JSON.stringify(data));
            });
            localStorage.setItem('narraitor-npc-store', JSON.stringify({
              state: { npcs: npcRecord, error: null, loading: false },
              version: 1,
            }));
        
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
                useNPCStore?: { setState?: (updater: any) => void };
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
              const npcStore = testWindow.useNPCStore;
        
              if (!worldStore || !characterStore || !sessionStore || !npcStore) {
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
        
              npcStore.setState?.((state: any) => ({
                ...state,
                npcs: {
                  ...state?.npcs,
                  ...npcRecord,
                },
                entities: {
                  ...state?.entities,
                  ...npcRecord,
                },
                worldNpcs: {
                  ...state?.worldNpcs,
                  ...worldCharacterIds,
                },
                loading: false,
                error: null,
              }));
        
              sessionStore.setState?.((state: any) => ({          ...state,
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

      // The poll starts at document-start and can only seed once hydration has
      // attached every store to window. Against a cold `next dev` server that
      // takes longer than the old 5s budget, and once the interval clears,
      // __TEST_STORES_SEEDED__ never lands — so no waitForStoreReady timeout can
      // recover. 30s covers a cold chunk compile plus hydration (#1519). The
      // interval clears the moment seeding succeeds, so warm runs pay nothing.
      const pollIntervalMs = 100;
      const maxAttempts = 300;

      const didSeedStores = seedStoresFromFixtures();
      if (!didSeedStores) {
        let attempts = 0;
        const intervalId = window.setInterval(() => {
          attempts += 1;
          if (seedStoresFromFixtures() || attempts >= maxAttempts) {
            window.clearInterval(intervalId);
          }
        }, pollIntervalMs);
      }

      const didSeedJournalStore = seedJournalStoreFromFixtures();
      if (!didSeedJournalStore) {
        let attempts = 0;
        const intervalId = window.setInterval(() => {
          attempts += 1;
          if (seedJournalStoreFromFixtures() || attempts >= maxAttempts) {
            window.clearInterval(intervalId);
          }
        }, pollIntervalMs);
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
