import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

/**
 * The play surface's reading-position rules, measured against the element the
 * app actually scrolls (`.manuscript-overlay-main`).
 *
 * These started life in jsdom, where NarrativeHistory falls back to the Radix
 * viewport because the play surface's scroller isn't in the tree, and the
 * tests handed that fallback a fabricated scrollHeight/clientHeight. A test
 * that supplies the geometry isn't observing layout, which is why the whole
 * set stayed green through the DS3 auto-scroll regression. See
 * public_docs/development/visual-testing-best-practices.md, "Two tiers of
 * layout assertion".
 */

const SESSION_ID = 'session-cyberpunk-ghost';
const PLAY_URL = '/worlds/world-cyberpunk-2077/play';

// Subpixel slack. A surface parked at its latest beat measures 0 locally; this
// is room for fractional layout, not room for a beat-sized miss.
const AT_BOTTOM_TOLERANCE_PX = 4;

type ScrollState = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  distanceFromBottom: number;
};

const readScrollState = (page: Page): Promise<ScrollState> =>
  page.evaluate(() => {
    const scroller = document.querySelector(
      '.manuscript-overlay-main'
    ) as HTMLElement | null;
    if (!scroller) {
      throw new Error('Expected the play surface scroller to exist');
    }
    return {
      scrollTop: scroller.scrollTop,
      scrollHeight: scroller.scrollHeight,
      clientHeight: scroller.clientHeight,
      distanceFromBottom:
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight,
    };
  });

const openPlaySurface = async (page: Page): Promise<void> => {
  await seedTestData(page);
  await mockApiEndpoints(page);
  await page.goto(PLAY_URL);
  await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
    timeout: 30000,
  });
  await page.waitForSelector('.narrative-segment', { timeout: 30000 });
};

// The surface opens with a deferred smooth scroll, and a reflow anchors on the
// next frame, so every "is it at the bottom" check has to poll rather than read
// once.
const expectParkedAtLatestBeat = async (page: Page): Promise<void> => {
  await expect
    .poll(async () => (await readScrollState(page)).distanceFromBottom, {
      timeout: 10000,
    })
    .toBeLessThanOrEqual(AT_BOTTOM_TOLERANCE_PX);
};

test.describe('Play surface reading position', () => {
  test('Opens a session at its latest beat', async ({ page }) => {
    await openPlaySurface(page);
    await expectParkedAtLatestBeat(page);

    const state = await readScrollState(page);

    // Without this the assertion above passes on any surface too short to
    // scroll, which is every surface if the height chain breaks again.
    expect(state.scrollHeight).toBeGreaterThan(state.clientHeight);
    expect(state.scrollTop).toBeGreaterThan(0);

    const newestVisible = await page.evaluate(() => {
      const segments = Array.from(
        document.querySelectorAll('.narrative-segment')
      );
      const newest = segments[segments.length - 1];
      const scroller = document.querySelector('.manuscript-overlay-main');
      if (!newest || !scroller) return false;

      const newestRect = newest.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      return (
        newestRect.bottom <= scrollerRect.bottom + 1 &&
        newestRect.bottom > scrollerRect.top
      );
    });
    expect(newestVisible).toBe(true);
  });

  test('Follows a reader who is already at the latest beat down to a new one', async ({
    page,
  }) => {
    await openPlaySurface(page);
    await expectParkedAtLatestBeat(page);

    const newestContent =
      'The rooftop door gives way and the rain arrives all at once, which is the beat this reader should be carried down to.';

    await page.evaluate(
      ({ sessionId, content }) => {
        const store = (window as any).useNarrativeStore?.getState?.();
        if (!store?.addSegment) {
          throw new Error('Expected narrative store to be available');
        }

        store.addSegment(sessionId, {
          worldId: 'world-cyberpunk-2077',
          content,
          type: 'action',
          characterIds: ['char-cyberpunk-hacker'],
          metadata: {
            mood: 'action',
            location: 'Rooftop access',
            tags: ['reading-position'],
          },
          timestamp: new Date('2024-01-01T03:00:00.000Z'),
        });
      },
      { sessionId: SESSION_ID, content: newestContent }
    );

    await expect(page.getByText(newestContent)).toBeVisible({ timeout: 10000 });
    await expectParkedAtLatestBeat(page);

    // The catch-up affordance is for readers who were left behind. This one
    // wasn't, so offering it means the surface thinks it stranded them.
    await expect(page.getByRole('button', { name: /jump to latest/i })).toHaveCount(
      0
    );
  });

  test('Keeps the latest beat in view when a reflow makes the story taller', async ({
    page,
  }) => {
    await openPlaySurface(page);
    await expectParkedAtLatestBeat(page);

    const before = await readScrollState(page);

    // Narrowing rewraps the prose, which is content growth the reader didn't
    // ask for — the same shape as a segment growing while it streams in, and
    // the case the surface's ResizeObserver anchoring exists to absorb.
    await page.setViewportSize({ width: 375, height: 812 });

    await expectParkedAtLatestBeat(page);

    const after = await readScrollState(page);
    expect(after.scrollHeight).toBeGreaterThan(before.scrollHeight);
  });

  test('Leaves a reader who scrolled up where they are when a reflow makes the story taller', async ({
    page,
  }) => {
    await openPlaySurface(page);
    await expectParkedAtLatestBeat(page);

    await page.evaluate(() => {
      const scroller = document.querySelector(
        '.manuscript-overlay-main'
      ) as HTMLElement;
      scroller.scrollTo({ top: 0, behavior: 'auto' });
    });

    // The scroll event is what hands control to the reader; growing the page
    // before it lands races that handover.
    await page.waitForFunction(
      () =>
        (document.querySelector('.manuscript-overlay-main') as HTMLElement)
          ?.scrollTop === 0,
      undefined,
      { timeout: 10000 }
    );

    const before = await readScrollState(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(async () => (await readScrollState(page)).scrollHeight, {
        timeout: 10000,
      })
      .toBeGreaterThan(before.scrollHeight);

    expect((await readScrollState(page)).scrollTop).toBe(0);
  });
});
