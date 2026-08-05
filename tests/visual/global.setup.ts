import { chromium, FullConfig } from '@playwright/test';
import { SAMPLE_WORLDS } from '../fixtures/worlds.fixture';
import { SAMPLE_CHARACTERS } from '../fixtures/characters.fixture';
import { SAMPLE_GAME_SESSIONS } from '../fixtures/sessions.fixture';
import { SAMPLE_NARRATIVE_SEGMENTS, SAMPLE_DECISIONS } from '../fixtures/narrative.fixture';
import { getTimestamp } from '@/lib/utils';
import type { Decision, NarrativeSegment } from '@/types/narrative.types';

const authFile = 'tests/visual/.auth/seeded-state.json';
const GET_TIMESTAMP_SOURCE = getTimestamp.toString();

/**
 * Global Setup for Playwright Tests
 *
 * Seeds test data once and saves the browser state for reuse across all tests.
 * This eliminates redundant seeding operations and significantly improves test performance.
 */
async function globalSetup(config: FullConfig) {
  console.log('🌍 Global setup: Seeding test data once for all tests...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Ensure the application knows it's under Playwright before any scripts run
  await page.addInitScript(() => {
    (window as typeof window & { __PLAYWRIGHT__?: boolean }).__PLAYWRIGHT__ =
      true;
  });

  try {
    // Navigate to the app first to initialize stores
    await page.goto(config.projects[1]?.use.baseURL || 'http://localhost:3000');

    // Seed data using a more efficient approach
    await page.evaluate(
      async ({ testData, getTimestampSource }) => {
        const instantiateGetTimestamp = (source: string) =>
          new Function(`return (${source});`)() as () => string;
        const getTimestamp = instantiateGetTimestamp(getTimestampSource);
        const SEEDED_IMAGE_GENERATED_AT = '2024-01-01T00:00:00.000Z';
        const {
          SAMPLE_WORLDS,
          SAMPLE_CHARACTERS,
          SAMPLE_GAME_SESSIONS,
          SAMPLE_NARRATIVE_SEGMENTS,
          SAMPLE_DECISIONS,
        } = testData;

        // Deterministic bitmap placeholder generator (runs in browser)
        const generateBitmapPlaceholder = (seed: string): string => {
          try {
            const hash = (str: string) => {
              let h = 0;
              for (let i = 0; i < str.length; i++)
                h = (h * 31 + str.charCodeAt(i)) | 0;
              return Math.abs(h);
            };
            const h = hash(seed) % 360;
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            if (!ctx) return '';
            ctx.fillStyle = `hsl(${(h + 200) % 360} 50% 12%)`;
            ctx.fillRect(0, 0, 320, 180);
            ctx.fillStyle = `hsl(${(h + 210) % 360} 55% 16%)`;
            ctx.fillRect(0, 0, 320, 120);
            ctx.fillStyle = `hsl(${(h + 220) % 360} 60% 20%)`;
            ctx.fillRect(0, 0, 320, 80);
            const rng = (() => {
              let s = hash(seed) + 13;
              return () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff;
            })();
            for (let i = 0; i < 16; i++) {
              const x = i * 20 + Math.floor(rng() * 4);
              const w = 14 + Math.floor(rng() * 6);
              const ht = 30 + Math.floor(rng() * 90);
              ctx.fillStyle = `hsl(${(h + 240 + i * 2) % 360} 40% ${25 + (i % 3) * 5}%)`;
              ctx.fillRect(x, 150 - ht, w, ht);
              ctx.fillStyle = `hsl(${(h + 60) % 360} 90% 70%)`;
              for (let y = 150 - ht + 6; y < 150; y += 12) {
                for (let wx = x + 2; wx < x + w - 2; wx += 6) {
                  if (rng() > 0.4) ctx.fillRect(wx, y, 3, 4);
                }
              }
            }
            return canvas.toDataURL('image/png');
          } catch {
            return '';
          }
        };

        // Transform legacy SAMPLE_WORLDS to current World schema
        const toValidWorld = (world: any) => {
          const now = getTimestamp();
          const makeAttrId = (idx: number) => `attr-${world.id}-${idx + 1}`;
          const makeSkillId = (idx: number) => `skill-${world.id}-${idx + 1}`;

          const attributes = Array.isArray(world.attributes)
            ? world.attributes.map((attr: any, i: number) => ({
                id: makeAttrId(i),
                worldId: world.id,
                name: String(attr?.name ?? `Attribute ${i + 1}`),
                description: String(attr?.description ?? ''),
                baseValue:
                  typeof attr?.defaultValue === 'number'
                    ? attr.defaultValue
                    : typeof attr?.baseValue === 'number'
                      ? attr.baseValue
                      : 0,
                minValue:
                  typeof attr?.minValue === 'number' ? attr.minValue : 0,
                maxValue:
                  typeof attr?.maxValue === 'number' ? attr.maxValue : 10,
              }))
            : [];

          const skills = Array.isArray(world.skills)
            ? world.skills.map((skill: any, i: number) => ({
                id: makeSkillId(i),
                worldId: world.id,
                name: String(skill?.name ?? `Skill ${i + 1}`),
                description: String(skill?.description ?? ''),
                difficulty: 'medium',
                baseValue: 0,
                minValue: 0,
                maxValue: 10,
                attributeIds: [],
              }))
            : [];

          const image = {
            type: 'placeholder',
            url:
              world.image?.url ??
              generateBitmapPlaceholder(world.id || world.name || 'world'),
            // Rendered verbatim as "Generated: <date>", so it has to be fixed.
            // A live timestamp bakes the capture date into every baseline and
            // breaks them the next day. Matches the other seeded fixtures.
            generatedAt: SEEDED_IMAGE_GENERATED_AT,
          };

          return {
            id: world.id,
            name: String(world.name ?? 'Untitled World'),
            description: String(world.description ?? ''),
            genre: String(world.genre ?? 'cyberpunk'),
            attributes,
            skills,
            settings: {
              maxAttributes: 10,
              maxSkills: 10,
              attributePointPool: 20,
              skillPointPool: 20,
            },
            image,
            createdAt: String(world.createdAt ?? now),
            updatedAt: String(world.updatedAt ?? now),
          };
        };

        // Convert arrays to Record format that Zustand expects
        const worldsRecord = SAMPLE_WORLDS.reduce(
          (acc: Record<string, unknown>, world) => {
            acc[world.id] = toValidWorld(world);
            return acc;
          },
          {}
        );

        const charactersRecord = SAMPLE_CHARACTERS.reduce(
          (acc: Record<string, unknown>, char) => {
            acc[char.id] = char;
            return acc;
          },
          {}
        );

        const sessionsRecord = SAMPLE_GAME_SESSIONS.reduce(
          (acc: Record<string, unknown>, session) => {
            acc[session.id] = session;
            return acc;
          },
          {}
        );

        const segmentsRecord = SAMPLE_NARRATIVE_SEGMENTS.reduce<Record<string, NarrativeSegment>>(
          (acc, segment) => {
            acc[segment.id] = segment;
            return acc;
          },
          {}
        );

        const decisionsRecord = SAMPLE_DECISIONS.reduce<Record<string, Decision>>(
          (acc, decision) => {
            acc[decision.id] = decision;
            return acc;
          },
          {}
        );

        // Efficient seeding via localStorage (most reliable approach)
        const worldStoreData = {
          state: {
            worlds: worldsRecord,
            currentWorldId: SAMPLE_WORLDS[0]?.id || null,
            error: null,
            loading: false,
          },
          version: 1,
        };

        const characterStoreData = {
          state: {
            characters: charactersRecord,
            currentCharacterId: SAMPLE_CHARACTERS[0]?.id || null,
            error: null,
            loading: false,
          },
          version: 1,
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
                narrativeCount: 3,
              },
              'session-fantasy-mage': {
                id: 'session-fantasy-mage',
                worldId: 'world-fantasy-realm',
                characterId: 'char-fantasy-mage',
                lastPlayed: '2024-01-02T02:00:00.000Z',
                narrativeCount: 2,
              },
            },
            onboardingCompleted: true,
            error: null,
            loading: false,
          },
          version: 2,
        };

        const narrativeStoreData = {
          state: {
            segments: segmentsRecord,
            sessionSegments: {
              [SAMPLE_GAME_SESSIONS[0]?.id]: Object.keys(segmentsRecord).filter(
                (id) => {
                  const segment = segmentsRecord[id];
                  return segment?.sessionId === SAMPLE_GAME_SESSIONS[0]?.id;
                }
              ),
              [SAMPLE_GAME_SESSIONS[1]?.id]: Object.keys(segmentsRecord).filter(
                (id) => {
                  const segment = segmentsRecord[id];
                  return segment?.sessionId === SAMPLE_GAME_SESSIONS[1]?.id;
                }
              ),
            },
            decisions: decisionsRecord,
            sessionDecisions: {
              [SAMPLE_GAME_SESSIONS[0]?.id]: Object.keys(
                decisionsRecord
              ).filter((id) => {
                const decision = decisionsRecord[id];
                return (
                  decision?.narrativeSegmentId &&
                  String(decision.narrativeSegmentId).startsWith(
                    'segment-cyberpunk'
                  )
                );
              }),
              [SAMPLE_GAME_SESSIONS[1]?.id]: Object.keys(
                decisionsRecord
              ).filter((id) => {
                const decision = decisionsRecord[id];
                return (
                  decision?.narrativeSegmentId &&
                  String(decision.narrativeSegmentId).startsWith(
                    'segment-fantasy'
                  )
                );
              }),
            },
            endedSessions: {},
            currentEnding: null,
            isGeneratingEnding: false,
            endingError: null,
            error: null,
            loading: false,
          },
          version: 1,
        };

        // Seed localStorage
        localStorage.setItem(
          'narraitor-world-store',
          JSON.stringify(worldStoreData)
        );
        localStorage.setItem(
          'narraitor-character-store',
          JSON.stringify(characterStoreData)
        );
        localStorage.setItem(
          'narraitor-session-store',
          JSON.stringify(sessionStoreData)
        );
        localStorage.setItem(
          'narraitor-narrative-store',
          JSON.stringify(narrativeStoreData)
        );
        localStorage.setItem(
          'narraitor-journal-store',
          JSON.stringify({
            state: { entries: {}, sessionEntries: {} },
            version: 1,
          })
        );

        // Store test data globally for later access
        const testWindow = window;

        testWindow.__TEST_WORLDS__ = worldsRecord;
        testWindow.__TEST_CHARACTERS__ = charactersRecord;
        testWindow.__TEST_SESSIONS__ = sessionsRecord;
        testWindow.__TEST_SEGMENTS__ = segmentsRecord;
        testWindow.__TEST_DECISIONS__ = decisionsRecord;
        testWindow.__TEST_CURRENT_WORLD_ID__ = SAMPLE_WORLDS[0]?.id || null;
        testWindow.__TEST_SEEDED__ = true;

        // Also update the live stores if available to avoid hydration races
        const anyWin = window as any;
        if (anyWin.useWorldStore) {
          anyWin.useWorldStore.setState({
            worlds: worldsRecord,
            currentWorldId: SAMPLE_WORLDS[0]?.id || null,
            loading: false,
            error: null,
          });
        }
        if (anyWin.useCharacterStore) {
          anyWin.useCharacterStore.setState({
            characters: charactersRecord,
            currentCharacterId: SAMPLE_CHARACTERS[0]?.id || null,
            loading: false,
            error: null,
          });
        }
        if (anyWin.useSessionStore) {
          anyWin.useSessionStore.setState({
            savedSessions: sessionStoreData.state.savedSessions,
            onboardingCompleted: true,
            id: sessionStoreData.state.currentSessionId,
            worldId: 'world-cyberpunk-2077',
            characterId: 'char-cyberpunk-hacker',
            status: 'active',
            currentSceneId: null,
            playerChoices: [],
            error: null,
          });
        }

        console.log('✅ Global setup: Test data seeded successfully');
      },
      {
        testData: {
          SAMPLE_WORLDS,
          SAMPLE_CHARACTERS,
          SAMPLE_GAME_SESSIONS,
          SAMPLE_NARRATIVE_SEGMENTS,
          SAMPLE_DECISIONS,
        },
        getTimestampSource: GET_TIMESTAMP_SOURCE,
      }
    );

    // Wait for stores to initialize with seeded data
    await page.waitForTimeout(500);

    // Save authentication state (includes localStorage, sessionStorage, cookies, etc.)
    await page.context().storageState({ path: authFile });

    console.log('✅ Global setup: Browser state saved for test reuse');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
