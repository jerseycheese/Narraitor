import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { seedJournalEntriesForVisual } from './utils/game-session-page-seeder';

const seedMarginaliaLoreFact = async (page: Page) => {
  await page.addInitScript(async () => {
    const now = '2024-01-01T00:00:00.000Z';
    const fact = {
      id: 'fact-visual-arasaka',
      key: 'world-cyberpunk-2077:location_arasaka',
      value: 'Arasaka',
      aliases: [],
      category: 'locations',
      source: 'manual',
      worldId: 'world-cyberpunk-2077',
      visibility: 'world-shared',
      metadata: {
        description:
          "A corporate tower whose security systems anchor the test scene. It includes an 'unstable ley-line,' a shimmering conduit of volatile power that must stay readable inside narrow marginalia.",
        type: 'megacorp',
        importance: 'high',
      },
      createdAt: now,
      updatedAt: now,
    };

    const loreStore = {
      state: {
        facts: { [fact.id]: fact },
        entities: { [fact.id]: fact },
        factHistory: {},
        mergeAuditLog: [],
        loreUsage: {},
        loreUsageEvents: [],
        currentEntityId: null,
        error: null,
        loading: false,
      },
      version: 3,
    };

    await new Promise((resolve) => {
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
        const put = store.put(
          { id: 'lore-store', value: loreStore },
          'lore-store'
        );
        put.onsuccess = () => resolve('seeded');
        put.onerror = () => resolve('failed');
      };

      request.onerror = () => resolve('failed');
    });

    localStorage.setItem('lore-store', JSON.stringify(loreStore));
  });
};

test.describe('Manuscript regression assertions', () => {
  test('Play surface keeps location visible and offers the way back to a new segment', async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('.narrative-segment', { timeout: 10000 });

    await page.evaluate(() => {
      const store = (window as any).useNarrativeStore?.getState?.();
      if (!store) {
        throw new Error('Expected narrative store to be available');
      }

      const sessionId = 'session-cyberpunk-ghost';
      for (let index = 0; index < 12; index += 1) {
        store.addSegment(sessionId, {
          worldId: 'world-cyberpunk-2077',
          content: `The team advances through corridor ${index + 1}, pausing at each service hatch while rain hammers the glass above the atrium. The repeated movement creates enough manuscript history to require the real play surface to scroll.`,
          type: 'action',
          characterIds: ['char-cyberpunk-hacker'],
          metadata: {
            mood: 'tense',
            location: 'Arasaka tower',
            tags: ['scroll-regression'],
            characterIds: ['char-cyberpunk-hacker'],
          },
          timestamp: new Date(`2024-01-01T02:${10 + index}:00.000Z`),
        });
      }
    });

    await page.waitForFunction(
      () => document.querySelectorAll('.narrative-segment').length >= 16,
      undefined,
      { timeout: 10000 }
    );

    // Let the surface finish parking itself at the latest beat before scrolling
    // away from it. Its own settle scroll is smooth, so it emits a run of scroll
    // events over several frames; scrolling up mid-animation hands the surface
    // an event that's still moving *down*, which reads as following rather than
    // as the reader taking over, and then no affordance ever appears. Polling is
    // per animation frame, so an unchanged scrollTop across two polls means the
    // animation has stopped rather than that it hasn't started.
    await page.waitForFunction(
      () => {
        const scroller = document.querySelector('.manuscript-overlay-main') as HTMLElement | null;
        if (!scroller) return false;

        const tracker = window as unknown as { __parkedScrollTop?: number };
        const { scrollTop, scrollHeight, clientHeight } = scroller;
        const previous = tracker.__parkedScrollTop;
        tracker.__parkedScrollTop = scrollTop;

        return (
          scrollTop > 0 &&
          previous === scrollTop &&
          scrollHeight - scrollTop - clientHeight < 100
        );
      },
      undefined,
      { timeout: 10000 }
    );

    // The scroll event is what tells the surface the reader has taken over, so
    // wait for the surface to have *handled* it rather than for the position to
    // read 0 — a position check passes the moment the number lands, which is
    // before the listener runs, and passes vacuously if the view never moved at
    // all. This listener is registered after the surface's own, so it runs after
    // it: once the flag flips, the handover is done.
    await page.evaluate(() => {
      const scroller = document.querySelector(
        '.manuscript-overlay-main'
      ) as HTMLElement | null;
      if (!scroller) {
        throw new Error('Expected play surface scroller to exist');
      }

      (window as unknown as { __readerTookOver?: boolean }).__readerTookOver = false;
      scroller.addEventListener(
        'scroll',
        () => {
          (window as unknown as { __readerTookOver?: boolean }).__readerTookOver = true;
        },
        { once: true, passive: true }
      );

      scroller.scrollTo({ top: 0, behavior: 'auto' });
    });

    await page.waitForFunction(
      () => (window as unknown as { __readerTookOver?: boolean }).__readerTookOver === true,
      undefined,
      { timeout: 10000 }
    );

    const finalSegmentText =
      'The newest result lands on the page after the player commits to the route, and it must be brought into view by the play surface scroll controller.';

    await page.evaluate((content) => {
      const store = (window as any).useNarrativeStore?.getState?.();
      if (!store) {
        throw new Error('Expected narrative store to be available');
      }

      store.addSegment('session-cyberpunk-ghost', {
        worldId: 'world-cyberpunk-2077',
        content,
        type: 'action',
        characterIds: ['char-cyberpunk-hacker'],
        metadata: {
          mood: 'action',
          location: 'Rooftop access',
          tags: ['scroll-regression-final'],
          characterIds: ['char-cyberpunk-hacker'],
        },
        timestamp: new Date('2024-01-01T02:25:00.000Z'),
      });
    }, finalSegmentText);

    // The reader scrolled up, so the new beat must not move them. It waits at
    // the bottom behind an affordance instead — this used to scroll into view
    // on its own, which is the yank the play surface no longer performs.
    const jumpToLatest = page.getByRole('button', { name: /jump to latest/i });
    await expect(jumpToLatest).toBeVisible({ timeout: 10000 });

    const heldPosition = await page.evaluate(() => {
      const scroller = document.querySelector('.manuscript-overlay-main') as HTMLElement | null;
      return scroller?.scrollTop ?? -1;
    });
    expect(heldPosition).toBe(0);

    await jumpToLatest.click();

    await page.waitForFunction(
      (content) => {
        const newestSegment = Array.from(
          document.querySelectorAll('.narrative-segment')
        ).find((segment) => segment.textContent?.includes(content));
        if (!newestSegment) return false;

        const scroller = document.querySelector('.manuscript-overlay-main');
        if (!scroller) return false;

        const newestRect = newestSegment.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        return (
          newestRect.top >= scrollerRect.top &&
          newestRect.bottom <= scrollerRect.bottom
        );
      },
      finalSegmentText,
      { timeout: 10000 }
    );

    const geometry = await page.evaluate((content) => {
      const scroller = document.querySelector('.manuscript-overlay-main');
      const location = document.querySelector('.scene-status-location');
      const newestSegment = Array.from(
        document.querySelectorAll('.narrative-segment')
      ).find((segment) => segment.textContent?.includes(content));

      if (!scroller || !location || !newestSegment) {
        return null;
      }

      const scrollerRect = scroller.getBoundingClientRect();
      const locationRect = location.getBoundingClientRect();
      const newestRect = newestSegment.getBoundingClientRect();

      return {
        scrollTop: Math.round((scroller as HTMLElement).scrollTop),
        viewportHeight: Math.round(window.innerHeight),
        locationTop: Math.round(locationRect.top),
        locationBottom: Math.round(locationRect.bottom),
        newestTop: Math.round(newestRect.top),
        newestBottom: Math.round(newestRect.bottom),
        scrollerTop: Math.round(scrollerRect.top),
        scrollerBottom: Math.round(scrollerRect.bottom),
      };
    }, finalSegmentText);

    expect(geometry).not.toBeNull();
    if (!geometry) {
      throw new Error('Expected scroll geometry to be measurable');
    }

    expect(geometry.scrollTop).toBeGreaterThan(0);
    expect(geometry.locationTop).toBeGreaterThanOrEqual(0);
    expect(geometry.locationBottom).toBeLessThanOrEqual(
      geometry.viewportHeight
    );
    expect(geometry.newestTop).toBeGreaterThanOrEqual(geometry.scrollerTop);
    expect(geometry.newestBottom).toBeLessThanOrEqual(geometry.scrollerBottom);
  });

  test('Marginalia definition below the gutter lane sits to the right of the prose column, not flush with it', async ({ page }) => {
    // 1100px is below the 1280px lane floor, so this is the in-flow fallback:
    // align-self: flex-end inside the segment's flex column.
    await page.setViewportSize({ width: 1100, height: 800 });
    await seedTestData(page);
    await seedMarginaliaLoreFact(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('.narrative-segment', { timeout: 10000 });

    await page.getByRole('button', { name: 'Arasaka' }).first().click();
    await expect(
      page.getByRole('complementary', { name: 'Definition: Arasaka' })
    ).toBeVisible();

    const geometry = await page.evaluate(() => {
      const definition = document.querySelector(
        '.manuscript-marginalia-definition'
      );
      const segment = definition?.closest('.narrative-segment');
      const prose = segment?.querySelector(
        '[data-testid="narrative-content-container"]'
      );

      if (!definition || !prose) {
        return null;
      }

      const definitionRect = definition.getBoundingClientRect();
      const proseRect = prose.getBoundingClientRect();

      return {
        definitionLeft: Math.round(definitionRect.left),
        definitionRight: Math.round(definitionRect.right),
        proseLeft: Math.round(proseRect.left),
        viewportWidth: Math.round(window.innerWidth),
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry) {
      throw new Error('Expected marginalia geometry to be measurable');
    }

    // The bug this guards against: `float` is a no-op on a flex child, so the
    // definition rendered flush with the prose column's left edge instead of
    // pulled into the margin. `align-self: flex-end` is the fix (matches
    // .choice-outcome-callout, the sibling element with the identical shape).
    expect(geometry.definitionLeft).toBeGreaterThan(geometry.proseLeft + 16);
    expect(geometry.definitionRight).toBeLessThanOrEqual(
      geometry.viewportWidth
    );
  });

  test('Gutter marginalia stays inside the visible scroller and clear of the prose', async ({ page }) => {
    // The invariant #1592 shipped without. That round bounded the note only
    // from the left and from above the clicked term, both of which stayed true
    // while the note's own top ran off the top of the scroller and
    // `overflow: hidden` ate the category badge and term name - the parts that
    // make it a definition rather than a stray paragraph.
    //
    // The seeded description is deliberately longer than the paragraph it
    // annotates (a ~219px note against a ~121px segment at this width), which
    // is the exact shape that broke: clamping the note against its own segment
    // leaves no slot to fit it in.
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedTestData(page);
    await seedMarginaliaLoreFact(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('.narrative-segment', { timeout: 10000 });

    // Scroll the paragraph that names the term up to the top of the scroller
    // before opening the note. That is both the ordinary reading position and
    // the one with no headroom above the segment, so a note taller than its
    // paragraph has nowhere to go but off the top - which is exactly what the
    // old segment-relative clamp did.
    const annotatedSegmentIndex = await page.evaluate(() => {
      const scroller = document.querySelector(
        '.manuscript-overlay-main'
      ) as HTMLElement;
      const segments = Array.from(
        document.querySelectorAll('.narrative-segment')
      );
      const index = segments.findIndex((segment) =>
        segment.querySelector('.manuscript-marginalia-term')
      );
      if (!scroller || index < 0) return -1;
      scroller.scrollTop +=
        segments[index].getBoundingClientRect().top -
        scroller.getBoundingClientRect().top -
        8;
      return index;
    });
    expect(annotatedSegmentIndex).toBeGreaterThanOrEqual(0);
    await page.waitForTimeout(200);

    const proseBefore = await page.evaluate(() => {
      const prose = document.querySelector(
        '[data-testid="narrative-content-container"]'
      );
      if (!prose) return null;
      const rect = prose.getBoundingClientRect();
      return { left: Math.round(rect.left), right: Math.round(rect.right) };
    });
    expect(proseBefore).not.toBeNull();

    await page.getByRole('button', { name: 'Arasaka' }).first().click();
    await expect(
      page.getByRole('complementary', { name: 'Definition: Arasaka' })
    ).toBeVisible();

    const geometry = await page.evaluate(() => {
      const definition = document.querySelector(
        '.manuscript-marginalia-definition'
      );
      const segment = definition?.closest('.narrative-segment');
      const prose = segment?.querySelector(
        '[data-testid="narrative-content-container"]'
      );
      const scroller = document.querySelector('.manuscript-overlay-main');
      const category = definition?.querySelector(
        '.manuscript-marginalia-category'
      );
      const name = definition?.querySelector('.manuscript-marginalia-name');

      if (!definition || !prose || !scroller || !category || !name) {
        return null;
      }

      const definitionRect = definition.getBoundingClientRect();
      const proseRect = prose.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const categoryRect = category.getBoundingClientRect();
      const nameRect = name.getBoundingClientRect();

      return {
        definitionTop: Math.round(definitionRect.top),
        definitionBottom: Math.round(definitionRect.bottom),
        definitionLeft: Math.round(definitionRect.left),
        definitionRight: Math.round(definitionRect.right),
        definitionWidth: Math.round(definitionRect.width),
        proseRight: Math.round(proseRect.right),
        proseLeft: Math.round(proseRect.left),
        segmentBottom: Math.round(
          (segment as HTMLElement).getBoundingClientRect().bottom
        ),
        scrollerTop: Math.round(scrollerRect.top),
        scrollerBottom: Math.round(scrollerRect.bottom),
        scrollerRight: Math.round(scrollerRect.right),
        categoryTop: Math.round(categoryRect.top),
        nameBottom: Math.round(nameRect.bottom),
        documentScrollWidth: document.documentElement.scrollWidth,
        documentClientWidth: document.documentElement.clientWidth,
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry || !proseBefore) {
      throw new Error('Expected gutter marginalia geometry to be measurable');
    }

    // The invariant that was missing: every edge of the note, and the two
    // pieces of it that identify the term, sit inside the visible scroller.
    expect(geometry.definitionTop).toBeGreaterThanOrEqual(
      geometry.scrollerTop
    );
    expect(geometry.definitionBottom).toBeLessThanOrEqual(
      geometry.scrollerBottom
    );
    expect(geometry.categoryTop).toBeGreaterThanOrEqual(geometry.scrollerTop);
    expect(geometry.nameBottom).toBeLessThanOrEqual(geometry.scrollerBottom);

    // Taller than the paragraph it annotates, which is what made the old
    // segment-relative clamp unsatisfiable. If this stops being true the test
    // above has stopped covering the bug and the fixture needs a longer
    // description.
    expect(geometry.definitionBottom).toBeGreaterThan(geometry.segmentBottom);

    // In the gutter, not in the prose column.
    expect(geometry.definitionLeft).toBeGreaterThanOrEqual(
      geometry.proseRight
    );
    expect(geometry.definitionRight).toBeLessThanOrEqual(
      geometry.scrollerRight
    );

    // Readability floor from #1595: the old formula bottomed out near 88px,
    // which left about 64px of text and broke ordinary words mid-syllable.
    expect(geometry.definitionWidth).toBeGreaterThanOrEqual(224);

    // Carving the lane must not shift the prose column.
    expect(geometry.proseLeft).toBe(proseBefore.left);
    expect(geometry.proseRight).toBe(proseBefore.right);

    // And it must not buy the lane with a horizontal scrollbar.
    expect(geometry.documentScrollWidth).toBe(geometry.documentClientWidth);
  });

  test('Left gutter outcome marks stay inside the visible scroller, clear of the prose, and clear of each other', async ({ page }) => {
    // Mirrors the right-gutter invariant above, with the same scoping the
    // marginalia test uses: control which segments carry a mark and where
    // they land, rather than trusting whichever segment seedTestData's own
    // decision happens to auto-link and wherever the app's default
    // scroll-to-latest leaves it. The default seed links exactly one segment,
    // and auto-follow can leave that segment straddling the fold — a couple
    // of its own pixels legitimately scrolled past the top, same as any other
    // content in that segment. That's ordinary scrolling, not a defect; two
    // short segments seeded directly, both fitting in the viewport at
    // scrollTop 0, is what actually exercises the invariant this test names:
    // whether the carve places a mark correctly beside its own segment, and
    // whether two marks on screen at once clear each other.
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('.narrative-segment', { timeout: 10000 });

    await page.evaluate(() => {
      const store = (window as any).useNarrativeStore?.getState?.();
      if (!store?.clearSessionSegments || !store?.addSegment) {
        throw new Error('Expected narrative store to be available');
      }

      const sessionId = 'session-cyberpunk-ghost';
      store.clearSessionSegments(sessionId);
      store.addSegment(sessionId, {
        worldId: 'world-cyberpunk-2077',
        content: 'The first short beat of narration.',
        type: 'scene',
        characterIds: ['char-cyberpunk-hacker'],
        metadata: {
          causedByDecisionId: 'decision-left-gutter-a',
          causedByDecisionText: 'You choose to slip past the guard',
          decisionOutcome: 'success',
        },
        timestamp: new Date(),
      });
      store.addSegment(sessionId, {
        worldId: 'world-cyberpunk-2077',
        content: 'The second short beat of narration.',
        type: 'scene',
        characterIds: ['char-cyberpunk-hacker'],
        metadata: {
          causedByDecisionId: 'decision-left-gutter-b',
          causedByDecisionText: 'You choose to bluff the fixer',
          decisionOutcome: 'failure',
        },
        timestamp: new Date(),
      });
    });

    await page.waitForFunction(
      () => document.querySelectorAll('.choice-outcome-callout').length === 2,
      undefined,
      { timeout: 10000 }
    );

    // Auto-follow anchors the newest segment to the bottom of the scroller on
    // every addSegment, even when both segments would otherwise fit — the
    // same "keep the latest turn in view" behavior a chat-style history has
    // by design. That's a real, separate feature, not this lane's failure
    // mode; scroll back to the top to measure the invariant this test
    // actually names — both marks placed correctly and clear of each other —
    // independent of auto-follow's own target.
    await page.evaluate(() => {
      const scroller = document.querySelector('.manuscript-overlay-main');
      if (scroller) (scroller as HTMLElement).scrollTop = 0;
    });
    await page.waitForTimeout(100);

    const geometry = await page.evaluate(() => {
      const marks = Array.from(
        document.querySelectorAll('.choice-outcome-callout')
      );
      const scroller = document.querySelector('.manuscript-overlay-main');

      // Any segment's prose container — all share the same column position.
      const prose = document.querySelector(
        '[data-testid="narrative-content-container"]'
      );

      if (marks.length !== 2 || !scroller || !prose) return null;

      const scrollerRect = scroller.getBoundingClientRect();
      const proseRect = prose.getBoundingClientRect();

      const markRects = marks.map((mark) => {
        const r = mark.getBoundingClientRect();
        return {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          left: Math.round(r.left),
          right: Math.round(r.right),
        };
      });

      return {
        markRects,
        proseLeft: Math.round(proseRect.left),
        scrollerTop: Math.round(scrollerRect.top),
        scrollerBottom: Math.round(scrollerRect.bottom),
        scrollerLeft: Math.round(scrollerRect.left),
        scrollerScrollTop: (scroller as HTMLElement).scrollTop,
        documentScrollWidth: document.documentElement.scrollWidth,
        documentClientWidth: document.documentElement.clientWidth,
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry) {
      throw new Error('Expected left gutter mark geometry to be measurable');
    }

    // Both short segments fit without scrolling, so both marks are fully in
    // view — the scenario that actually exercises "inside the scroller" and
    // "clear of each other" at once.
    expect(geometry.scrollerScrollTop).toBe(0);

    for (const mark of geometry.markRects) {
      // Every edge inside the visible scroller.
      expect(mark.top).toBeGreaterThanOrEqual(geometry.scrollerTop);
      expect(mark.bottom).toBeLessThanOrEqual(geometry.scrollerBottom);
      expect(mark.left).toBeGreaterThanOrEqual(geometry.scrollerLeft);

      // Mark is in the left lane, not overlapping the prose column.
      expect(mark.right).toBeLessThanOrEqual(geometry.proseLeft);
    }

    // Marks must not overlap each other (the failure mode the right lane
    // can't have, since it holds one note at a time).
    for (let i = 1; i < geometry.markRects.length; i++) {
      expect(geometry.markRects[i].top).toBeGreaterThanOrEqual(
        geometry.markRects[i - 1].bottom
      );
    }

    // Must not buy the lane with a horizontal scrollbar.
    expect(geometry.documentScrollWidth).toBe(geometry.documentClientWidth);
  });

  test('A mark with many consequence chips is capped rather than overlapping the next mark', async ({ page }) => {
    // Being absolute, a mark reserves no height in the segment's flow, unlike
    // the sub-1280px card, which pushes the next segment down by whatever it
    // needs. An option with several consequence chips on a short segment can
    // grow taller than the segment box and run into the next segment's own
    // mark - a real defect a code reviewer caught in this PR, reproduced here
    // with five consequences (four relationships plus an alignment shift) on
    // a one-word segment immediately followed by another decision-linked
    // segment. The fix is a height cap with overflow hidden on the mark
    // itself: worse than showing everything, better than corrupting the
    // neighbor's mark, and the realistic case (the one or two consequences an
    // option actually carries) never gets near the cap - see the sibling test
    // above, which has no cap-related slack in its assertions.
    await page.setViewportSize({ width: 1280, height: 900 });
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('.narrative-segment', { timeout: 10000 });

    await page.evaluate(() => {
      const useStore = (window as any).useNarrativeStore;
      const store = useStore?.getState?.();
      if (!useStore || !store?.clearSessionSegments || !store?.addSegment) {
        throw new Error('Expected narrative store to be available');
      }

      const sessionId = 'session-cyberpunk-ghost';

      useStore.setState({
        decisions: {
          ...store.decisions,
          'decision-stress-many-chips': {
            id: 'decision-stress-many-chips',
            prompt: 'stress',
            options: [
              {
                id: 'opt-stress',
                text: 'stress option',
                consequences: [
                  { type: 'relationship', targetId: 'npc-kira', value: { trustDelta: -15 } },
                  { type: 'relationship', targetId: 'npc-raven', value: { trustDelta: 12 } },
                  { type: 'relationship', targetId: 'npc-fixer', value: { trustDelta: -8 } },
                  { type: 'relationship', targetId: 'npc-guard-1', value: { trustDelta: 6 } },
                  { type: 'alignment', value: 12 },
                ],
              },
            ],
            selectedOptionId: 'opt-stress',
          },
        },
      });

      store.clearSessionSegments(sessionId);
      store.addSegment(sessionId, {
        worldId: 'world-cyberpunk-2077',
        content: 'Short.',
        type: 'scene',
        characterIds: ['char-cyberpunk-hacker'],
        metadata: {
          causedByDecisionId: 'decision-stress-many-chips',
          causedByDecisionText: 'You choose to bluff the fixer',
          decisionOutcome: 'success',
        },
        timestamp: new Date(),
      });
      store.addSegment(sessionId, {
        worldId: 'world-cyberpunk-2077',
        content: 'The next beat.',
        type: 'scene',
        characterIds: ['char-cyberpunk-hacker'],
        metadata: {
          causedByDecisionId: 'decision-left-gutter-b',
          causedByDecisionText: 'You choose to run',
          decisionOutcome: 'failure',
        },
        timestamp: new Date(),
      });
    });

    await page.waitForFunction(
      () => document.querySelectorAll('.choice-outcome-callout').length === 2,
      undefined,
      { timeout: 10000 }
    );

    await page.evaluate(() => {
      const scroller = document.querySelector('.manuscript-overlay-main');
      if (scroller) (scroller as HTMLElement).scrollTop = 0;
    });
    await page.waitForTimeout(100);

    const geometry = await page.evaluate(() => {
      const marks = Array.from(
        document.querySelectorAll('.choice-outcome-callout')
      );
      if (marks.length !== 2) return null;

      return marks.map((mark) => {
        const r = mark.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
      });
    });

    expect(geometry).not.toBeNull();
    if (!geometry) {
      throw new Error('Expected both marks to be measurable');
    }

    // The overlap this guards against: the first mark's five chips push its
    // own bottom edge down; without a cap it lands below the second mark's
    // top and both become unreadable where they cross.
    expect(geometry[1].top).toBeGreaterThanOrEqual(geometry[0].bottom);
  });

  test('Choice badges stay above the 12px legibility floor', async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('.manuscript-alignment-badge, .manuscript-skill-check-badge', {
      timeout: 10000,
    });

    // #1683: these badges sat at 0.625rem (10px), below anything a player is
    // meant to read at a glance while scanning choices.
    const badgeFontSizes = await page.evaluate(() => {
      const badges = Array.from(
        document.querySelectorAll(
          '.manuscript-alignment-badge, .manuscript-skill-check-badge'
        )
      );
      return badges.map((badge) => parseFloat(getComputedStyle(badge).fontSize));
    });

    expect(badgeFontSizes.length).toBeGreaterThan(0);
    for (const fontSize of badgeFontSizes) {
      expect(fontSize).toBeGreaterThanOrEqual(12);
    }
  });

  test('Journal snapshot meta row stays above the 12px legibility floor', async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });

    // A DS3-only override on `:root .manuscript-journal-snapshot-meta` clobbered
    // the base rule's font-size bump (missed in the initial #1683 pass), so this
    // opens the real drawer rather than only checking the base-rule selector.
    await seedJournalEntriesForVisual(page);
    await page.getByRole('button', { name: 'Journal' }).click();
    await page.waitForSelector('.manuscript-journal-snapshot-meta', { timeout: 10000 });

    const metaFontSize = await page.evaluate(() => {
      const meta = document.querySelector('.manuscript-journal-snapshot-meta');
      return meta ? parseFloat(getComputedStyle(meta).fontSize) : null;
    });

    expect(metaFontSize).not.toBeNull();
    expect(metaFontSize as number).toBeGreaterThanOrEqual(12);
  });

  test('Short narrative content does not leave a conspicuous dead band above the choices rail', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('.narrative-segment', { timeout: 10000 });

    // Trim to a single short segment so the narrative column is well short of
    // the available height — the scenario #1683 measured ~193px (~19% of a
    // 1024px-tall viewport) of dead space in.
    //
    // addSegment auto-links the session's most recent decision onto any new
    // segment (see narrativeStore.segments.ts), so this segment renders a
    // ChoiceOutcomeCallout from seedTestData's sample decision even though
    // nothing here sets causedByDecisionId directly.
    await page.evaluate(() => {
      const store = (window as any).useNarrativeStore?.getState?.();
      if (!store?.clearSessionSegments || !store?.addSegment) {
        throw new Error('Expected narrative store to be available');
      }

      const sessionId = 'session-cyberpunk-ghost';
      store.clearSessionSegments(sessionId);
      store.addSegment(sessionId, {
        worldId: 'world-cyberpunk-2077',
        content: 'A single short beat of narration.',
        type: 'scene',
        characterIds: ['char-cyberpunk-hacker'],
        metadata: { tags: ['dead-band-regression'], location: 'Test Location' },
        timestamp: new Date(),
      });
    });

    await page.waitForFunction(
      () => document.querySelectorAll('.narrative-segment').length === 1,
      undefined,
      { timeout: 10000 }
    );

    // Wait for the segment's rendered height to stop changing before
    // measuring geometry, rather than trusting the first paint of the text —
    // the same stable-for-a-beat pattern waitForStableScrollHeight uses
    // elsewhere in this file's utils. This also covers the general case
    // where a segment carries a decision-outcome callout: the callout mounts
    // in the same render as the segment's text, so waiting for the whole
    // segment box to settle waits for both together.
    await page.waitForFunction(
      () => {
        const segment = document.querySelector('.narrative-segment');
        if (!segment) return false;

        const height = segment.getBoundingClientRect().height;
        const tracker = window as unknown as {
          __deadBandLastHeight?: number;
          __deadBandStableSince?: number;
        };

        if (tracker.__deadBandLastHeight !== height) {
          tracker.__deadBandLastHeight = height;
          tracker.__deadBandStableSince = Date.now();
          return false;
        }

        return Date.now() - (tracker.__deadBandStableSince ?? Date.now()) >= 200;
      },
      undefined,
      { timeout: 10000 }
    );

    const geometry = await page.evaluate(() => {
      const narrativeContainer = document.querySelector(
        '.manuscript-narrative-container'
      );
      const decision = document.querySelector('#manuscript-decision-block');

      if (!narrativeContainer || !decision) {
        return null;
      }

      return {
        narrativeBottom: narrativeContainer.getBoundingClientRect().bottom,
        decisionTop: decision.getBoundingClientRect().top,
        viewportHeight: window.innerHeight,
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry) {
      throw new Error('Expected play surface geometry to be measurable');
    }

    const gap = geometry.decisionTop - geometry.narrativeBottom;

    // The dead band was an artifact of docking: the choices sat in their own
    // grid row at the bottom of the viewport, so a short beat left everything
    // between them and the prose empty. In one column the decision follows the
    // prose immediately, and the gap is just the beat break's own margin —
    // ~48px, and bounded by content rather than by viewport height. 10% of the
    // viewport still catches any regression toward a reserved row.
    expect(gap).toBeLessThan(geometry.viewportHeight * 0.1);
  });

  test('Choices scroll with the story rather than docking against it', async ({ page }) => {
    // The narrative row used to share the viewport with a docked choices row,
    // so a full set of choices on a narrow/short viewport squeezed the story
    // text down to ~16px. The fix isn't a better height budget — it's having
    // no second row to budget against. Guard the shape, not the numbers: one
    // scroll container, and the decision sitting after the prose inside it.
    await page.setViewportSize({ width: 375, height: 667 });
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('#manuscript-decision-block', { timeout: 10000 });

    const geometry = await page.evaluate(() => {
      const main = document.querySelector('.manuscript-overlay-main');
      const decision = document.querySelector('#manuscript-decision-block');
      const narrative = document.querySelector('.manuscript-narrative-container');
      if (!main || !decision || !narrative) return null;

      const scrolls = (el: Element) => {
        const overflowY = window.getComputedStyle(el).overflowY;
        return (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight + 1
        );
      };

      // Every scrolling box between the decision and the surface root. In a
      // single-flow document that set is exactly {.manuscript-overlay-main}.
      const scrollAncestors: string[] = [];
      for (
        let el: Element | null = decision;
        el && el !== document.documentElement;
        el = el.parentElement
      ) {
        if (scrolls(el)) {
          scrollAncestors.push(el.className || el.tagName.toLowerCase());
        }
      }

      return {
        mainHeight: main.getBoundingClientRect().height,
        viewportHeight: window.innerHeight,
        decisionScrollsItself: scrolls(decision),
        scrollAncestorCount: scrollAncestors.length,
        decisionFollowsNarrative:
          decision.getBoundingClientRect().top >=
          narrative.getBoundingClientRect().top,
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry) {
      throw new Error('Expected play surface geometry to be measurable');
    }

    // The document gets the viewport below the HUD — no row is reserved from it.
    expect(geometry.mainHeight).toBeGreaterThan(geometry.viewportHeight * 0.6);

    // A nested scroller is the failure this rework exists to prevent: it puts
    // the choices behind a second scrollbar the player has to discover.
    expect(geometry.decisionScrollsItself).toBe(false);
    expect(geometry.scrollAncestorCount).toBeLessThanOrEqual(1);

    expect(geometry.decisionFollowsNarrative).toBe(true);
  });

  test('Play surface fits a 375px viewport instead of being clipped past its right edge', async ({
    page,
  }) => {
    // The surface's grid tracks were declared `1fr`, which means `minmax(auto,
    // 1fr)`, an auto floor equal to the widest item's min-content. The stage's
    // widest item is the scene-status bar, so the story column rendered 432px
    // wide inside 351px of room and .manuscript-viewport-shell's `overflow:
    // hidden` cut the excess off with nowhere to scroll to.
    //
    // This measures geometry rather than asserting on the resolved
    // grid-template-columns. That value reads back fine while the column
    // overflows, and pinning the declaration would go red on any other correct
    // way of holding the column in. What a player notices is text disappearing
    // off the right edge, so that is what gets measured.
    await page.setViewportSize({ width: 375, height: 812 });
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('.manuscript-suggested-action', { timeout: 10000 });

    const geometry = await page.evaluate(() => {
      const shell = document.querySelector('.manuscript-viewport-shell');
      const stage = document.querySelector('.manuscript-main-stage');
      const content = document.querySelector('.manuscript-main-content');
      if (!shell || !stage || !content) return null;

      // Every laid-out box whose right edge sits past the viewport. The shell
      // clips rather than scrolls, so anything here is unreachable, not
      // merely off-screen. `sr-only` boxes are 1px clipping wrappers by
      // design and never render text.
      const overflowing = Array.from(document.querySelectorAll('*'))
        .filter((el) => {
          if (el.closest('.sr-only')) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.right > window.innerWidth + 0.5;
        })
        .map((el) => `${el.tagName.toLowerCase()}.${el.className}`);

      // A skill check reads "STEALTH" or "STEALTH · RISKY"; it is `white-space: nowrap`, so
      // a column that is too narrow truncates the number rather than wrapping.
      const badges = Array.from(
        document.querySelectorAll('.manuscript-skill-check-badge')
      ).map((el) => {
        const badge = el as HTMLElement;
        return {
          right: badge.getBoundingClientRect().right,
          clipped: badge.scrollWidth > badge.clientWidth + 1,
        };
      });

      // Holding the column in isn't enough on its own: the badge row and the
      // choice label sit in the same flex row, and the label's basis is 0
      // while the badge row's is `auto`. Pull the badges back inside the
      // viewport without stacking the two and the badges simply claim their
      // max-content, leaving the label a zero-width column with the badges
      // painted over the top of it. So measure both, per choice.
      const choices = Array.from(
        document.querySelectorAll('.manuscript-suggested-action')
      ).map((el) => {
        const action = el as HTMLElement;
        const label = action.querySelector('.manuscript-suggested-action-label');
        const badgeRow = action.querySelector('.manuscript-suggested-action-badges');
        const actionRect = action.getBoundingClientRect();
        const labelRect = label?.getBoundingClientRect();

        let overlapArea = 0;
        if (labelRect && badgeRow) {
          const badgeRect = badgeRow.getBoundingClientRect();
          const w = Math.min(labelRect.right, badgeRect.right) - Math.max(labelRect.left, badgeRect.left);
          const h = Math.min(labelRect.bottom, badgeRect.bottom) - Math.max(labelRect.top, badgeRect.top);
          overlapArea = w > 0 && h > 0 ? Math.round(w * h) : 0;
        }

        return {
          actionWidth: actionRect.width,
          labelWidth: labelRect?.width ?? 0,
          labelShare: labelRect ? labelRect.width / actionRect.width : 0,
          overlapArea,
        };
      });

      return {
        viewportWidth: window.innerWidth,
        stageWidth: stage.getBoundingClientRect().width,
        contentWidth: content.getBoundingClientRect().width,
        overflowingCount: overflowing.length,
        overflowing: overflowing.slice(0, 5),
        badgeCount: badges.length,
        badgesClipped: badges.filter((b) => b.clipped).length,
        badgesPastEdge: badges.filter((b) => b.right > window.innerWidth + 0.5).length,
        choiceCount: choices.length,
        narrowestLabelShare: Math.min(...choices.map((c) => c.labelShare)),
        narrowestLabelWidth: Math.min(...choices.map((c) => c.labelWidth)),
        maxLabelBadgeOverlap: Math.max(...choices.map((c) => c.overlapArea)),
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry) {
      throw new Error('Expected play surface geometry to be measurable');
    }

    // The story column is held by its container rather than by its content.
    expect(geometry.stageWidth).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.contentWidth).toBeLessThanOrEqual(geometry.stageWidth);

    expect(
      geometry.overflowingCount,
      `Boxes past the right edge: ${geometry.overflowing.join(', ')}`
    ).toBe(0);

    // Guard against the assertions above passing because no choices rendered.
    expect(geometry.badgeCount).toBeGreaterThan(0);
    expect(geometry.choiceCount).toBeGreaterThan(0);

    expect(geometry.badgesPastEdge).toBe(0);
    expect(geometry.badgesClipped).toBe(0);

    // Nothing may be drawn over the choice text. Measured as real rectangle
    // intersection rather than a shared-row check, because the two boxes
    // overlap horizontally while their tops differ once the label wraps tall.
    expect(
      geometry.maxLabelBadgeOverlap,
      'Badge row must not overlap the choice label'
    ).toBe(0);

    // And the text needs room to actually read as a sentence. Half the button
    // is a floor, not a target: at 375px the label gets about 76% of it. The
    // failure this catches is the label collapsing toward a min-content column
    // one word wide, which stays technically unclipped the whole way down.
    expect(
      geometry.narrowestLabelShare,
      `Narrowest choice label was ${Math.round(geometry.narrowestLabelWidth)}px`
    ).toBeGreaterThan(0.5);
  });
});
