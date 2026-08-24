import { test, expect } from '@playwright/test';
import { getTimestamp } from '@/lib/utils';

/**
 * Character roster narrative context — single-theme (default DS1).
 *
 * DS coverage (#1264): this spec verifies roster *content* (narrative threads,
 * relationships, major events, cross-character references), not theme layout. The
 * characters roster surface is covered across DS1/DS2/DS3 by
 * tests/visual/characters-themes.spec.ts.
 */

const WORLD_ID = 'world-roster-playwright';
const CHAR_ALPHA = 'char-alpha-playwright';
const CHAR_BETA = 'char-beta-playwright';

test.describe('Character roster context', () => {
  test('shows narrative threads and relationships for each character', async ({
    page,
    baseURL,
  }) => {
    const now = getTimestamp();

    const worldEntry = {
      id: WORLD_ID,
      name: 'Playwright Test World',
      description: 'Seeded world to exercise character roster context',
      genre: 'fantasy',
      attributes: [],
      skills: [],
      derivedStats: [],
      createdAt: now,
      updatedAt: now,
    };

    const worldState = {
      worldId: WORLD_ID,
      version: 1,
      lastModified: now,
      npcRelationships: {},
      majorEvents: [
        {
          id: 'event-alpha-discovery',
          description:
            'Hero Alpha discovered ancient artifacts in the flooded ruins, uncovering evidence of the lost civilization',
          timestamp: now,
          characterId: CHAR_ALPHA,
          sessionId: 'session-alpha',
        },
      ],
      playerCharacterThreads: {
        [`thread-${CHAR_ALPHA}`]: {
          id: `thread-${CHAR_ALPHA}`,
          characterId: CHAR_ALPHA,
          worldId: WORLD_ID,
          summary: 'Investigating the ruins near the falls.',
          highlights: ['Investigating the ruins near the falls.'],
          sessionIds: ['session-alpha'],
          crossCharacterReferences: [
            {
              characterId: CHAR_BETA,
              summary:
                'Envoy Beta warned Alpha about supply shortages in the port district.',
              sessionId: 'session-beta',
              lastReferencedAt: now,
            },
          ],
          lastUpdated: now,
        },
        [`thread-${CHAR_BETA}`]: {
          id: `thread-${CHAR_BETA}`,
          characterId: CHAR_BETA,
          worldId: WORLD_ID,
          summary: 'Monitoring the northern pass for unrest.',
          highlights: ['Monitoring the northern pass for unrest.'],
          sessionIds: ['session-beta'],
          crossCharacterReferences: [
            {
              characterId: CHAR_ALPHA,
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
        [CHAR_ALPHA]: {
          [CHAR_BETA]: {
            sentiment: 65,
            trust: 84,
            tension: 45,
            lastInteraction: now,
            sessionId: 'session-alpha',
          },
        },
        [CHAR_BETA]: {
          [CHAR_ALPHA]: {
            sentiment: 15,
            trust: 55,
            tension: 20,
            lastInteraction: now,
            sessionId: 'session-beta',
          },
        },
      },
    };

    const makeChar = (id: string, name: string, description: string) => ({
      id,
      name,
      description,
      worldId: WORLD_ID,
      level: 3,
      isPlayer: true,
      attributes: [],
      skills: [],
      derivedStats: [],
      background: {
        history: 'A well-traveled specialist who keeps extensive notes.',
        personality: 'Methodical yet personable',
        goals: ['Secure the northern settlements'],
        fears: ['Losing the trail'],
        relationships: [],
      },
      status: { conditions: [] },
      inventory: {
        characterId: id,
        items: [],
        capacity: 100,
        categories: [],
        itemOrder: [],
      },
      createdAt: now,
      updatedAt: now,
    });

    const charAlpha = makeChar(
      CHAR_ALPHA,
      'Hero Alpha',
      'Lead investigator from the capital'
    );
    const charBeta = makeChar(
      CHAR_BETA,
      'Envoy Beta',
      'Diplomatic envoy assigned to border talks'
    );

    await page.goto(`${baseURL}/characters?worldId=${WORLD_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // Wait for both stores to finish hydrating from IndexedDB before injecting
    // data, so the persist rehydration doesn't overwrite our setState call.
    await page.waitForFunction(
      () => {
        const win = window as any;
        const charHydrated =
          win.useCharacterStore?.persist?.hasHydrated?.() ?? false;
        const worldHydrated =
          win.useWorldStore?.persist?.hasHydrated?.() ?? false;
        return charHydrated && worldHydrated;
      },
      { timeout: 15000 }
    );

    await page.evaluate(
      ({ worldId, worldEntry, worldState, charAlpha, charBeta }) => {
        const win = window as any;
        win.useWorldStore.setState((s: any) => ({
          ...s,
          worlds: { ...s.worlds, [worldId]: worldEntry },
          entities: { ...s.entities, [worldId]: worldEntry },
          worldStates: { ...s.worldStates, [worldId]: worldState },
          currentWorldId: worldId,
          currentEntityId: worldId,
        }));
        win.useCharacterStore.setState((s: any) => ({
          ...s,
          characters: {
            ...s.characters,
            [charAlpha.id]: charAlpha,
            [charBeta.id]: charBeta,
          },
          entities: {
            ...s.entities,
            [charAlpha.id]: charAlpha,
            [charBeta.id]: charBeta,
          },
          worldCharacterIds: {
            ...s.worldCharacterIds,
            [worldId]: [charAlpha.id, charBeta.id],
          },
          currentCharacterId: charAlpha.id,
          currentEntityId: charAlpha.id,
        }));
      },
      { worldId: WORLD_ID, worldEntry, worldState, charAlpha, charBeta }
    );

    const cards = page.locator('.component-character-card');
    await expect(cards).toHaveCount(2);

    // DS3's roster card deliberately hides the recent-event/connections blurb
    // (app-shell.css: `.character-card-recent`/`.character-card-connections`
    // { display: none }, pre-existing, not a DS3-specific bug) to keep the
    // compact list dense. This test's job is the content pipeline -- that the
    // seeded major event and cross-character reference actually reach the
    // card's DOM -- not whether that markup happens to be visible in the
    // current theme. Use toBeAttached() rather than toBeVisible().
    await expect(
      cards
        .first()
        .locator(
          'text=Hero Alpha discovered ancient artifacts in the flooded ruins'
        )
    ).toBeAttached();
    await expect(cards.first().locator('text=Envoy Beta')).toBeAttached();

    // Envoy Beta card should carry its connection to Hero Alpha (no major event for Beta)
    await expect(cards.nth(1).locator('text=Hero Alpha')).toBeAttached();

    await expect(page).toHaveScreenshot('characters-roster.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });
});
