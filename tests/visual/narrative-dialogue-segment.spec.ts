import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

/**
 * The model types a whole scene as `dialogue` whenever it contains spoken
 * lines, so most of a dialogue segment is ordinary narration. Anything applied
 * to the segment lands on that narration too, which is why the treatment has to
 * stay off the prose itself.
 */
const DIALOGUE_SEGMENT_CONTENT = [
  'You step past the threshold of the fixer\'s back room, the faint scent of scorched solder still clinging to the air. She looks up from a bench of half-gutted decks, shoulders slumped under a weight she has carried far longer than tonight.',
  '"Nice deck," she says, turning it over in her hands. "Arasaka custom job, looks like."',
  'The chrome of her eyes catches the strip light as she sets it down, and for a moment the room is quiet enough to hear the rain working at the window.',
].join('\n\n');

const SCENE_SEGMENT_CONTENT =
  'Rain pelts the neon-soaked street outside, and the crowd thins to nothing as the district settles into its night shift.';

const openPlaySurface = async (page: Page) => {
  await seedTestData(page);
  await mockApiEndpoints(page);

  await page.goto('/worlds/world-cyberpunk-2077/play');
  await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
    timeout: 10000,
  });
  await page.waitForSelector('.narrative-segment', { timeout: 10000 });
};

/** Replaces the seeded history with one dialogue segment and one scene segment. */
const seedDialogueAndScene = async (page: Page) => {
  await page.evaluate(
    ([dialogueContent, sceneContent]) => {
      const store = (
        window as unknown as {
          useNarrativeStore?: {
            getState?: () => {
              clearSessionSegments?: (sessionId: string) => void;
              addSegment?: (sessionId: string, segment: unknown) => void;
            };
          };
        }
      ).useNarrativeStore?.getState?.();

      if (!store?.clearSessionSegments || !store?.addSegment) {
        throw new Error('Expected narrative store to be available');
      }

      const sessionId = 'session-cyberpunk-ghost';
      store.clearSessionSegments(sessionId);

      store.addSegment(sessionId, {
        worldId: 'world-cyberpunk-2077',
        content: dialogueContent,
        type: 'dialogue',
        characterIds: ['char-cyberpunk-hacker'],
        metadata: { tags: ['dialogue-treatment'], location: 'Neo-Tokyo alley' },
        timestamp: new Date('2024-01-01T02:00:00.000Z'),
      });

      store.addSegment(sessionId, {
        worldId: 'world-cyberpunk-2077',
        content: sceneContent,
        type: 'scene',
        characterIds: ['char-cyberpunk-hacker'],
        metadata: { tags: ['dialogue-treatment'], location: 'Neo-Tokyo alley' },
        timestamp: new Date('2024-01-01T02:05:00.000Z'),
      });
    },
    [DIALOGUE_SEGMENT_CONTENT, SCENE_SEGMENT_CONTENT]
  );

  await page.waitForSelector('.dialogue-segment', { timeout: 10000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.narrative-segment').length === 2,
    { timeout: 10000 }
  );
};

test.describe('Dialogue segment treatment', () => {
  test('Dialogue narration reads upright while the segment keeps a marker', async ({
    page,
  }) => {
    await openPlaySurface(page);
    await seedDialogueAndScene(page);

    const treatment = await page.evaluate(() => {
      const dialogue = document.querySelector('.dialogue-segment');
      const scene = document.querySelector(
        '.narrative-segment [data-testid="narrative-content-container"]:not(.dialogue-segment)'
      );

      if (!dialogue || !scene) {
        return null;
      }

      const dialogueParagraphs = Array.from(dialogue.querySelectorAll('p'));
      const dialogueStyle = getComputedStyle(dialogue);
      const dialogueMark = getComputedStyle(dialogue, '::before');
      const sceneMark = getComputedStyle(scene, '::before');

      return {
        paragraphCount: dialogueParagraphs.length,
        paragraphFontStyles: dialogueParagraphs.map(
          (paragraph) => getComputedStyle(paragraph).fontStyle
        ),
        dialogueFontStyle: dialogueStyle.fontStyle,
        dialogueLeft: Math.round(dialogue.getBoundingClientRect().left),
        sceneLeft: Math.round(scene.getBoundingClientRect().left),
        dialogueMarkWidth: parseFloat(dialogueMark.borderTopWidth) || 0,
        sceneMarkWidth: parseFloat(sceneMark.borderTopWidth) || 0,
      };
    });

    expect(treatment).not.toBeNull();
    if (!treatment) {
      throw new Error('Expected the dialogue segment to be measurable');
    }

    // The narration around the spoken lines is the bulk of the segment, so
    // every paragraph has to render upright, not just the quoted one.
    expect(treatment.paragraphCount).toBeGreaterThan(1);
    expect(treatment.dialogueFontStyle).toBe('normal');
    for (const fontStyle of treatment.paragraphFontStyles) {
      expect(fontStyle).toBe('normal');
    }

    // Prose sits in the same column as any other segment, with no inset that
    // would read as a pull-quote.
    expect(treatment.dialogueLeft).toBe(treatment.sceneLeft);

    // A distinction still survives: a drafting mark above the block that a
    // scene segment does not get.
    expect(treatment.dialogueMarkWidth).toBeGreaterThan(0);
    expect(treatment.sceneMarkWidth).toBe(0);
  });

  test('Dialogue segment renders consistently', async ({ page }) => {
    await openPlaySurface(page);
    await seedDialogueAndScene(page);

    // Clips to the segment rather than the prose container alone: the
    // participants row is sticky, so a clip that starts at the prose would be
    // captured with that row painted over its first line.
    const dialogueSegment = page.locator('.narrative-segment').first();
    await expect(dialogueSegment).toHaveScreenshot('dialogue-segment.png');
  });
});
