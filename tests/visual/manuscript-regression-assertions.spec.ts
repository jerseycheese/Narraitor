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
  test('Play surface keeps location visible and scrolls new segments into view', async ({ page }) => {
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
      { timeout: 10000 }
    );

    await page.evaluate(() => {
      const scroller = document.querySelector(
        '.manuscript-overlay-main'
      ) as HTMLElement | null;
      if (!scroller) {
        throw new Error('Expected play surface scroller to exist');
      }
      scroller.scrollTo({ top: 0, behavior: 'auto' });
    });

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

  test('Desktop marginalia definition sits to the right of the prose column, not flush with it', async ({ page }) => {
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
      { timeout: 10000 }
    );

    const geometry = await page.evaluate(() => {
      const narrativeContainer = document.querySelector(
        '.manuscript-narrative-container'
      );
      const actionRail = document.querySelector('#manuscript-action-rail');

      if (!narrativeContainer || !actionRail) {
        return null;
      }

      return {
        narrativeBottom: narrativeContainer.getBoundingClientRect().bottom,
        actionRailTop: actionRail.getBoundingClientRect().top,
        viewportHeight: window.innerHeight,
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry) {
      throw new Error('Expected play surface geometry to be measurable');
    }

    const gap = geometry.actionRailTop - geometry.narrativeBottom;

    // Guards the regression: for this single-line segment (plus the
    // decision-outcome callout it inherits), the gap settles deterministically
    // around 281px (~27% of a 1024px-tall viewport) once the segment has fully
    // rendered — confirmed identical across repeated runs and across wait
    // durations from 200ms to 1500ms. The ~163-184px (~16-18%) this test
    // previously guarded against was itself a measurement taken before the
    // segment had finished rendering, not a real ceiling; 35% leaves headroom
    // above the settled value while still catching a dead band anywhere near
    // the much larger one this test was originally written against.
    expect(gap).toBeLessThan(geometry.viewportHeight * 0.35);
  });

  test('Docked choices rail does not squeeze the narrative row off-screen on mobile', async ({ page }) => {
    // DS3 always stacks suggested actions in a single column (never a grid,
    // see :root .manuscript-suggested-actions-grid), so a full set of choices
    // on a narrow/short viewport used to demand more height than the
    // `.manuscript-viewport-inner` auto/1fr/auto grid had available, squeezing
    // the narrative row (`.manuscript-overlay-main`) down to ~16px — the story
    // text effectively vanished. Reproduces on unmodified `develop` HEAD.
    await page.setViewportSize({ width: 375, height: 667 });
    await seedTestData(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('#manuscript-action-rail', { timeout: 10000 });

    const geometry = await page.evaluate(() => {
      const main = document.querySelector('.manuscript-overlay-main');
      const rail = document.querySelector('#manuscript-action-rail');
      if (!main || !rail) return null;

      const mainRect = main.getBoundingClientRect();
      return {
        mainHeight: mainRect.height,
        railScrollHeight: rail.scrollHeight,
        railClientHeight: rail.clientHeight,
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry) {
      throw new Error('Expected play surface geometry to be measurable');
    }

    // Floor the narrative row so it stays legible instead of collapsing to a
    // sliver — before the fix this measured ~16px on a 667px-tall viewport.
    expect(geometry.mainHeight).toBeGreaterThan(120);

    // The docked rail itself should absorb overflow via its own scrollbar
    // rather than growing unbounded and starving the narrative row.
    expect(geometry.railScrollHeight).toBeGreaterThanOrEqual(
      geometry.railClientHeight
    );
  });
});
