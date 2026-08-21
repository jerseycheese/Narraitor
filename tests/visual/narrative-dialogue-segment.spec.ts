import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

/**
 * The model types a whole scene as `dialogue` whenever it contains spoken
 * lines, so most of a dialogue segment is ordinary narration. Anything hung on
 * `.dialogue-segment` lands on that narration too, which is why the segment
 * carries no treatment at all and these specs pin the absence.
 *
 * Sized to the range the issue measured on a live session, 700 to 1,100
 * characters, so the capture renders at the length the complaint was about
 * rather than a tidy three-line sample.
 */
const LONG_DIALOGUE_CONTENT = [
  `You step past the threshold of the fixer's back room, where the faint scent of scorched solder still clings to the air and a single strip light buzzes over a bench of half-gutted decks. She looks up as the door settles behind you, shoulders slumped under a weight she has clearly been carrying a good deal longer than tonight.`,
  `"Nice deck," she says, turning it over in her hands. "Arasaka custom job, looks like. You didn't walk in here with that by accident."`,
  `The chrome of her eyes catches the light as she sets it down on the bench between you, and for a moment the room is quiet enough to hear the rain working at the window and the slow tick of the cooling fans racked behind her.`,
  `She waits. Whatever she is weighing, she is in no hurry to say it out loud, and the silence stretches until it is doing the negotiating on her behalf.`,
].join('\n\n');

const SCENE_SEGMENT_CONTENT =
  'Rain pelts the neon-soaked street outside, and the crowd thins to nothing as the district settles into its night shift.';

/**
 * Two dialogue segments back to back, then a scene. At the rate the model types
 * segments as `dialogue` this run happens a few times in a session, and it is
 * the arrangement any treatment would read worst in: an arbitrary divider
 * dropped between two halves of one continuous conversation.
 */
const FIRST_CONSECUTIVE_DIALOGUE = [
  `The fixer waves you toward the stool across from her bench without looking up from the deck she is stripping for parts.`,
  `"Sit," she says. "You're bleeding on my floor, and I'd rather hear the pitch before I decide whether to care."`,
].join('\n\n');

const SECOND_CONSECUTIVE_DIALOGUE = [
  `You take the stool. She sets the deck aside, finally, and folds her hands on the bench in the manner of someone who has already decided how the conversation ends.`,
  `"Arasaka," she says, flatly. "You want into Arasaka. Say the rest of it before I talk myself out of listening."`,
].join('\n\n');

type SegmentSeed = {
  content: string;
  type: 'dialogue' | 'scene';
};

const openPlaySurface = async (page: Page, colorScheme?: 'light' | 'dark') => {
  if (colorScheme) {
    // Seeds the real storage key rather than adding the class by hand, matching
    // the sibling specs: ThemeProvider's effect removes a class it did not set.
    await page.addInitScript((value) => {
      window.localStorage.setItem('narraitor-color-scheme', value);
    }, colorScheme);
  }

  await seedTestData(page);
  await mockApiEndpoints(page);

  await page.goto('/worlds/world-cyberpunk-2077/play');
  await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
    timeout: 10000,
  });
  await page.waitForSelector('.narrative-segment', { timeout: 10000 });
};

/** Replaces the seeded history with exactly the segments given, in order. */
const seedSegments = async (page: Page, segments: SegmentSeed[]) => {
  await page.evaluate((seeds) => {
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

    seeds.forEach((seed, index) => {
      store.addSegment?.(sessionId, {
        worldId: 'world-cyberpunk-2077',
        content: seed.content,
        type: seed.type,
        characterIds: ['char-cyberpunk-hacker'],
        metadata: {
          tags: ['dialogue-treatment'],
          location: 'Neo-Tokyo alley',
        },
        timestamp: new Date(`2024-01-01T02:0${index}:00.000Z`),
      });
    });
  }, segments);

  await page.waitForFunction(
    (expected) =>
      document.querySelectorAll('.narrative-segment').length === expected,
    segments.length,
    { timeout: 10000 }
  );
};

const dialogueThenScene: SegmentSeed[] = [
  { content: LONG_DIALOGUE_CONTENT, type: 'dialogue' },
  { content: SCENE_SEGMENT_CONTENT, type: 'scene' },
];

test.describe('Dialogue segment treatment', () => {
  test('A dialogue segment renders exactly like a scene segment', async ({
    page,
  }) => {
    await openPlaySurface(page);
    await seedSegments(page, dialogueThenScene);
    await page.waitForSelector('.dialogue-segment', { timeout: 10000 });

    const treatment = await page.evaluate(() => {
      const dialogue = document.querySelector('.dialogue-segment');
      const scene = document.querySelector(
        '.narrative-segment [data-testid="narrative-content-container"]:not(.dialogue-segment)'
      );

      if (!dialogue || !scene) {
        return null;
      }

      const readTreatment = (element: Element) => {
        const style = getComputedStyle(element);
        const mark = getComputedStyle(element, '::before');
        return {
          fontStyle: style.fontStyle,
          borderLeftWidth: style.borderLeftWidth,
          paddingLeft: style.paddingLeft,
          marginLeft: style.marginLeft,
          markBorderTopWidth: parseFloat(mark.borderTopWidth) || 0,
          markContent: mark.content,
          left: Math.round(element.getBoundingClientRect().left),
          width: Math.round(element.getBoundingClientRect().width),
        };
      };

      return {
        dialogue: readTreatment(dialogue),
        scene: readTreatment(scene),
        dialogueParagraphFontStyles: Array.from(
          dialogue.querySelectorAll('p')
        ).map((paragraph) => getComputedStyle(paragraph).fontStyle),
      };
    });

    expect(treatment).not.toBeNull();
    if (!treatment) {
      throw new Error('Expected the dialogue segment to be measurable');
    }

    // The narration around the spoken lines is the bulk of the segment, so
    // every paragraph has to render upright, not just the quoted one.
    expect(treatment.dialogueParagraphFontStyles.length).toBeGreaterThan(3);
    for (const fontStyle of treatment.dialogueParagraphFontStyles) {
      expect(fontStyle).toBe('normal');
    }

    // Everything a treatment could hang off matches the scene segment, which is
    // the whole point: a dialogue segment is prose and reads as prose.
    expect(treatment.dialogue.fontStyle).toBe('normal');
    expect(treatment.dialogue.fontStyle).toBe(treatment.scene.fontStyle);
    expect(treatment.dialogue.borderLeftWidth).toBe(
      treatment.scene.borderLeftWidth
    );
    expect(treatment.dialogue.paddingLeft).toBe(treatment.scene.paddingLeft);
    expect(treatment.dialogue.marginLeft).toBe(treatment.scene.marginLeft);
    expect(treatment.dialogue.left).toBe(treatment.scene.left);
    expect(treatment.dialogue.width).toBe(treatment.scene.width);

    // No decorative mark on either one.
    expect(treatment.dialogue.markBorderTopWidth).toBe(0);
    expect(treatment.scene.markBorderTopWidth).toBe(0);
  });

  test('Dialogue segment renders consistently', async ({ page }) => {
    await openPlaySurface(page);
    await seedSegments(page, dialogueThenScene);
    await page.waitForSelector('.dialogue-segment', { timeout: 10000 });

    // Clips to the segment rather than the prose container alone: the
    // participants row is sticky, so a clip that starts at the prose would be
    // captured with that row painted over its first line.
    const dialogueSegment = page.locator('.narrative-segment').first();
    await expect(dialogueSegment).toHaveScreenshot('dialogue-segment.png');
  });

  test('Dialogue segment renders consistently in dark mode', async ({
    page,
  }) => {
    await openPlaySurface(page, 'dark');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await seedSegments(page, dialogueThenScene);
    await page.waitForSelector('.dialogue-segment', { timeout: 10000 });

    const dialogueSegment = page.locator('.narrative-segment').first();
    await expect(dialogueSegment).toHaveScreenshot('dialogue-segment-dark.png');
  });

  test('Consecutive dialogue segments read as continuous prose', async ({
    page,
  }) => {
    await openPlaySurface(page);
    await seedSegments(page, [
      { content: FIRST_CONSECUTIVE_DIALOGUE, type: 'dialogue' },
      { content: SECOND_CONSECUTIVE_DIALOGUE, type: 'dialogue' },
      { content: SCENE_SEGMENT_CONTENT, type: 'scene' },
    ]);
    await page.waitForFunction(
      () => document.querySelectorAll('.dialogue-segment').length === 2,
      { timeout: 10000 }
    );

    const columns = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(
          '.narrative-segment [data-testid="narrative-content-container"]'
        )
      ).map((element) => Math.round(element.getBoundingClientRect().left))
    );

    // Two dialogue segments and a scene, all sharing one column edge. A
    // treatment on the dialogue class would break this into an indented pair
    // followed by a flush paragraph.
    expect(columns).toHaveLength(3);
    expect(new Set(columns).size).toBe(1);

    await page.locator('.manuscript-overlay-main').evaluate((element) => {
      element.scrollTo({ top: 0, behavior: 'auto' });
    });

    // Clips to the two prose blocks and the join between them. A whole-scroller
    // capture is mostly empty column, and it catches the dev-server overlay
    // badge in the corner, whose issue count is not ours to keep stable.
    const clip = await page.evaluate(() => {
      const blocks = Array.from(
        document.querySelectorAll('.dialogue-segment')
      ).map((element) => element.getBoundingClientRect());

      const first = blocks[0];
      const last = blocks[blocks.length - 1];
      return {
        x: Math.round(first.left),
        y: Math.round(first.top),
        width: Math.round(first.width),
        height: Math.round(last.bottom - first.top),
      };
    });

    await expect(page).toHaveScreenshot('consecutive-dialogue-segments.png', {
      clip,
    });
  });
});
