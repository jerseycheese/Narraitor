import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { hideDynamicContent, waitForContentStable } from './utils/wait-helpers';

/**
 * Structured choice consequences (#468): trust deltas and alignment shifts
 * carried by decision options must render as visible, persistent state in the
 * play surface — consequence chips under the choice-outcome callout,
 * disposition tags on SceneStatus participants, and the alignment row in the
 * CharacterSnapshot HUD panel.
 *
 * All three surfaces render nothing without data, so this spec seeds its own
 * consequence state via the dev-exposed window stores (post-hydration, per
 * the store-seeding convention) and uses NEW baseline names — existing
 * game-session baselines stay untouched.
 */

const PLAY_URL = '/worlds/world-cyberpunk-2077/play';
const WORLD_ID = 'world-cyberpunk-2077';
const CHARACTER_ID = 'char-cyberpunk-hacker';
const DECISION_ID = 'decision-cyberpunk-route';
const SELECTED_OPTION_ID = 'option-elevator';

const openPlaySurface = async (page: Page): Promise<void> => {
  await seedTestData(page);
  await mockApiEndpoints(page);
  await page.goto(PLAY_URL);
  await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 60000 });

  // Seeded IndexedDB writes race store rehydration — wait for the stores we
  // patch to finish hydrating before touching them.
  await page.waitForFunction(
    () => {
      const w = window as unknown as Record<string, { persist?: { hasHydrated?: () => boolean } } | undefined>;
      return (
        w.useNarrativeStore?.persist?.hasHydrated?.() === true &&
        w.useWorldStore?.persist?.hasHydrated?.() === true &&
        w.useCharacterStore?.persist?.hasHydrated?.() === true
      );
    },
    { timeout: 15000 },
  );
};

/**
 * Patches the seeded session with consequence-bearing state: an alignment on
 * the player character, relationship state for the latest segment's NPCs,
 * structured consequences on the seeded decision, and (optionally) a selected
 * option + decision-linked segment so the outcome callout renders chips.
 */
const seedConsequenceState = async (page: Page, options: { selectOption: boolean }): Promise<void> => {
  await page.evaluate(
    ({ worldId, characterId, decisionId, selectedOptionId, selectOption }) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const w = window as any;

      // The seeder arms window.__TEST_CHARACTERS__, which makes the play
      // surface read a frozen character copy instead of the store. Drop into
      // normal store mode so alignment changes are observable in the UI.
      delete w.__TEST_CHARACTERS__;

      // Character alignment already shifted chaotic by earlier choices.
      const characters = w.useCharacterStore.getState().characters;
      w.useCharacterStore.setState({
        characters: {
          ...characters,
          [characterId]: { ...characters[characterId], alignment: -42 },
        },
      });

      // Relationship state for the latest segment's participants.
      const iso = '2026-01-01T12:00:00.000Z';
      w.useWorldStore.setState((state: any) => ({
        worldStates: {
          ...state.worldStates,
          [worldId]: {
            npcRelationships: {
              'npc-raven': { trust: 80, sentiment: 45, lastInteraction: iso, sessionId: 'visual-seed' },
              'npc-kira': { trust: 22, sentiment: -40, lastInteraction: iso, sessionId: 'visual-seed' },
            },
            majorEvents: [],
            storyCheckpoints: [],
            playerCharacterThreads: {},
            characterRelationships: {},
          },
        },
      }));

      // Structured consequences on the seeded decision. value: 12 moves the
      // -42 (Chaotic) character to -30 (Neutral) when selected — a visible
      // label change for the functional test.
      const narrative = w.useNarrativeStore.getState();
      const decision = narrative.decisions[decisionId];
      const patchedOptions = decision.options.map((option: any) =>
        option.id === selectedOptionId
          ? {
              ...option,
              consequences: [
                { type: 'relationship', action: 'modify', targetId: 'npc-kira', value: { trustDelta: -15 } },
                { type: 'alignment', action: 'add', targetId: 'player-alignment', value: 12 },
              ],
            }
          : option,
      );
      w.useNarrativeStore.setState({
        decisions: {
          ...narrative.decisions,
          [decisionId]: {
            ...decision,
            options: patchedOptions,
            ...(selectOption ? { selectedOptionId, characterId } : {}),
          },
        },
      });

      if (selectOption) {
        // Link the session's latest segment to the decision so the outcome
        // callout (and its chips) render in the narrative history.
        const refreshed = w.useNarrativeStore.getState();
        const sessionEntry = (Object.entries(refreshed.sessionSegments) as Array<[string, string[]]>).find(
          ([, segmentIds]) => segmentIds.some((id) => refreshed.segments[id]?.worldId === worldId),
        );
        if (sessionEntry) {
          const segmentIds = sessionEntry[1];
          const lastSegmentId = segmentIds[segmentIds.length - 1];
          const lastSegment = refreshed.segments[lastSegmentId];
          refreshed.updateSegment(lastSegmentId, {
            metadata: {
              ...lastSegment.metadata,
              causedByDecisionId: decisionId,
              causedByDecisionText: 'You choose to take the service elevator',
            },
          });
        }
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    },
    {
      worldId: WORLD_ID,
      characterId: CHARACTER_ID,
      decisionId: DECISION_ID,
      selectedOptionId: SELECTED_OPTION_ID,
      selectOption: options.selectOption,
    },
  );
};

const openCharacterPanel = async (page: Page): Promise<void> => {
  const hudToggle = page.locator('.manuscript-hud-character-pill');
  await expect(hudToggle).toBeVisible();
  await hudToggle.click();
  await page.waitForSelector('.manuscript-hud-character-panel', { state: 'visible', timeout: 10000 });
};

test.describe('Choice consequences in the play surface (#468)', () => {
  test('chips, dispositions, and alignment row render from consequence state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await openPlaySurface(page);
    await seedConsequenceState(page, { selectOption: true });

    // Outcome callout carries the structured consequence chips.
    const chips = page.locator('.choice-outcome-consequences').first();
    await expect(chips).toBeVisible({ timeout: 10000 });
    await expect(chips.locator('.choice-outcome-chip[data-kind="relationship"]')).toHaveText('Kira Tanaka −15 trust');
    await expect(chips.locator('.choice-outcome-chip[data-kind="alignment"]')).toHaveText('Order +12');

    // SceneStatus participants carry trust-derived disposition tags.
    const sceneStatus = page.locator('.component-scene-status').first();
    await expect(sceneStatus.locator('.scene-status-disposition[data-disposition="trusted"]')).toHaveText('Trusted');
    await expect(sceneStatus.locator('.scene-status-disposition[data-disposition="hostile"]')).toHaveText('Hostile');

    await waitForContentStable(page);
    await hideDynamicContent(page);
    await page.evaluate(() => document.fonts.ready);

    await expect(chips).toHaveScreenshot('choice-outcome-consequences-ds3.png');
    await expect(sceneStatus).toHaveScreenshot('scene-status-dispositions-ds3.png');

    // CharacterSnapshot shows the alignment row + meter in the HUD panel.
    await openCharacterPanel(page);
    const alignmentRow = page.getByTestId('character-snapshot-alignment');
    await expect(alignmentRow).toBeVisible();
    await expect(alignmentRow).toContainText('Chaotic');
    await expect(page.locator('.manuscript-hud-character-panel')).toHaveScreenshot(
      'character-snapshot-alignment-ds3.png',
    );
  });

  test('selecting an option applies its consequences to live, persistent state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await openPlaySurface(page);
    await seedConsequenceState(page, { selectOption: false });

    // Before: chaotic character, no relationship delta applied yet.
    await openCharacterPanel(page);
    await expect(page.getByTestId('character-snapshot-alignment')).toContainText('Chaotic');

    // Drive the real store action — no AI involved.
    await page.evaluate(
      ({ decisionId, selectedOptionId, characterId }) => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        (window as any).useNarrativeStore
          .getState()
          .selectDecisionOption(decisionId, selectedOptionId, characterId);
        /* eslint-enable @typescript-eslint/no-explicit-any */
      },
      { decisionId: DECISION_ID, selectedOptionId: SELECTED_OPTION_ID, characterId: CHARACTER_ID },
    );

    // The alignment consequence (+12) moves -42 (Chaotic) to -30 (Neutral)
    // and the snapshot label updates live.
    await expect(page.getByTestId('character-snapshot-alignment')).toContainText('Neutral');

    // The trust delta landed in world state (50 default would be wrong: we
    // seeded Kira at 22, so -15 clamps the merge at 7 -> still hostile).
    const kiraTrust = await page.evaluate(({ worldId }) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return (window as any).useWorldStore.getState().getRawWorldState(worldId)?.npcRelationships?.['npc-kira']?.trust;
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }, { worldId: WORLD_ID });
    expect(kiraTrust).toBe(7);

    // Persistent: the persist middleware wrote the shifted alignment through
    // to storage — read back through the store's own persist adapter, which
    // is backend-agnostic (IndexedDB in a real browser, fallback elsewhere).
    // A reload assertion would only test the harness: the seeder re-seeds
    // pristine fixture state on every page load.
    await expect
      .poll(
        async () =>
          page.evaluate(async ({ characterId }) => {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const storage = (window as any).useCharacterStore.persist.getOptions().storage;
            const value = await storage.getItem('narraitor-character-store');
            return value?.state?.characters?.[characterId]?.alignment;
            /* eslint-enable @typescript-eslint/no-explicit-any */
          }, { characterId: CHARACTER_ID }),
        { timeout: 5000 },
      )
      .toBe(-30);
  });
});
