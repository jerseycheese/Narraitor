import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

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

  test('Desktop marginalia definition sits in the right margin outside the prose column', async ({ page }) => {
    await page.setViewportSize({ width: 1005, height: 763 });
    await seedTestData(page);
    await seedMarginaliaLoreFact(page);
    await mockApiEndpoints(page);

    await page.goto('/worlds/world-cyberpunk-2077/play');
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
      timeout: 10000,
    });
    await page.waitForSelector('.narrative-segment', { timeout: 10000 });
    await page.evaluate(() => {
      const scroller = document.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement | null;
      const term = Array.from(
        document.querySelectorAll('.manuscript-marginalia-term')
      ).find((element) => element.textContent?.trim() === 'Arasaka');

      if (!scroller || !term) {
        throw new Error('Expected Arasaka term and history scroller');
      }

      const scrollerRect = scroller.getBoundingClientRect();
      const termRect = term.getBoundingClientRect();
      scroller.scrollTo({
        top: scroller.scrollTop + termRect.top - scrollerRect.bottom + 48,
        behavior: 'auto',
      });
    });

    const closedGeometry = await page.evaluate(() => {
      const history = document.querySelector('.narrative-history-container');
      const term = document.querySelector('.manuscript-marginalia-term');
      const segment = term?.closest('.narrative-segment');
      const prose = segment?.querySelector(
        '[data-testid="narrative-content-container"]'
      );
      const scrollViewport = document.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement | null;

      if (!history || !prose || !scrollViewport) {
        return null;
      }

      const historyRect = history.getBoundingClientRect();
      const proseRect = prose.getBoundingClientRect();
      const segmentRect = segment?.getBoundingClientRect();

      return {
        historyRight: Math.round(historyRect.right),
        proseLeft: Math.round(proseRect.left),
        proseRight: Math.round(proseRect.right),
        proseWidth: Math.round(proseRect.width),
        segmentHeight: segmentRect ? Math.round(segmentRect.height) : null,
        scrollViewportClientWidth: Math.round(scrollViewport.clientWidth),
        scrollViewportScrollWidth: Math.round(scrollViewport.scrollWidth),
      };
    });

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

      if (!definition || !segment || !prose) {
        return null;
      }

      const definitionRect = definition.getBoundingClientRect();
      const proseRect = prose.getBoundingClientRect();
      const segmentRect = segment.getBoundingClientRect();
      const callout = segment.querySelector('.choice-outcome-callout');
      const calloutRect = callout?.getBoundingClientRect();
      const firstCallout = document.querySelector('.choice-outcome-callout');
      const firstCalloutRect = firstCallout?.getBoundingClientRect();
      const firstCalloutProse = firstCallout
        ?.closest('.narrative-segment')
        ?.querySelector('[data-testid="narrative-content-container"]');
      const firstCalloutProseRect = firstCalloutProse?.getBoundingClientRect();
      const nextSegmentRect =
        segment.nextElementSibling?.getBoundingClientRect();
      const history = document.querySelector('.narrative-history-container');
      const overlayMain = document.querySelector(
        '.manuscript-overlay-main'
      ) as HTMLElement | null;
      const scrollViewport = document.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement | null;
      const clickedTerm = Array.from(
        document.querySelectorAll('.manuscript-marginalia-term')
      ).find((term) => term.textContent?.trim() === 'Arasaka');
      const clickedTermRect = clickedTerm?.getBoundingClientRect();
      const historyRect = history?.getBoundingClientRect();
      const scrollViewportRect = scrollViewport?.getBoundingClientRect();

      return {
        definitionLeft: Math.round(definitionRect.left),
        definitionRight: Math.round(definitionRect.right),
        definitionTop: Math.round(definitionRect.top),
        definitionBottom: Math.round(definitionRect.bottom),
        definitionClientHeight: Math.round(
          (definition as HTMLElement).clientHeight
        ),
        definitionClientWidth: Math.round(
          (definition as HTMLElement).clientWidth
        ),
        definitionScrollHeight: Math.round(
          (definition as HTMLElement).scrollHeight
        ),
        definitionScrollWidth: Math.round(
          (definition as HTMLElement).scrollWidth
        ),
        historyRight: historyRect ? Math.round(historyRect.right) : null,
        overlayClientWidth: overlayMain
          ? Math.round(overlayMain.clientWidth)
          : null,
        overlayScrollWidth: overlayMain
          ? Math.round(overlayMain.scrollWidth)
          : null,
        proseLeft: Math.round(proseRect.left),
        proseTop: Math.round(proseRect.top),
        proseRight: Math.round(proseRect.right),
        proseWidth: Math.round(proseRect.width),
        clickedTermTop: clickedTermRect
          ? Math.round(clickedTermRect.top)
          : null,
        calloutBottom: calloutRect ? Math.round(calloutRect.bottom) : null,
        firstCalloutRight: firstCalloutRect
          ? Math.round(firstCalloutRect.right)
          : null,
        firstCalloutProseRight: firstCalloutProseRect
          ? Math.round(firstCalloutProseRect.right)
          : null,
        rightGutter: Math.round(definitionRect.left - proseRect.right),
        segmentBottom: Math.round(segmentRect.bottom),
        segmentHeight: Math.round(segmentRect.height),
        nextSegmentTop: nextSegmentRect
          ? Math.round(nextSegmentRect.top)
          : null,
        scrollViewportClientWidth: scrollViewport
          ? Math.round(scrollViewport.clientWidth)
          : null,
        scrollViewportScrollWidth: scrollViewport
          ? Math.round(scrollViewport.scrollWidth)
          : null,
        scrollViewportRight: scrollViewportRect
          ? Math.round(scrollViewportRect.right)
          : null,
        scrollViewportBottom: scrollViewportRect
          ? Math.round(scrollViewportRect.bottom)
          : null,
        scrollViewportScrollLeft: scrollViewport?.scrollLeft ?? 0,
        viewportWidth: Math.round(window.innerWidth),
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry) {
      throw new Error('Expected marginalia geometry to be measurable');
    }

    expect(closedGeometry).not.toBeNull();
    if (!closedGeometry) {
      throw new Error('Expected closed marginalia geometry to be measurable');
    }

    expect(geometry.definitionLeft).toBeGreaterThanOrEqual(
      geometry.proseRight + 16
    );
    expect(geometry.clickedTermTop).not.toBeNull();
    expect(geometry.definitionTop).toBeLessThanOrEqual(
      (geometry.clickedTermTop as number) + 8
    );
    if (geometry.calloutBottom !== null) {
      expect(geometry.calloutBottom).toBeLessThan(geometry.definitionTop);
    }
    if (
      geometry.firstCalloutRight !== null &&
      geometry.firstCalloutProseRight !== null
    ) {
      expect(geometry.firstCalloutRight).toBeLessThanOrEqual(
        geometry.firstCalloutProseRight + 1
      );
    }
    if (geometry.nextSegmentTop !== null) {
      expect(geometry.definitionBottom).toBeLessThanOrEqual(
        geometry.nextSegmentTop - 8
      );
    }
    expect(Math.abs(geometry.proseLeft - closedGeometry.proseLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.proseRight - closedGeometry.proseRight)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.proseWidth - closedGeometry.proseWidth)).toBeLessThanOrEqual(1);
    expect(closedGeometry.segmentHeight).not.toBeNull();
    expect(
      Math.abs(geometry.segmentHeight - (closedGeometry.segmentHeight as number))
    ).toBeLessThanOrEqual(1);
    expect(geometry.rightGutter).toBeGreaterThanOrEqual(16);
    expect(geometry.definitionRight).toBeLessThanOrEqual(
      geometry.viewportWidth - 16
    );
    expect(geometry.scrollViewportRight).not.toBeNull();
    expect(geometry.definitionRight).toBeLessThanOrEqual(
      (geometry.scrollViewportRight as number) - 16
    );
    expect(geometry.scrollViewportBottom).not.toBeNull();
    expect(geometry.definitionBottom).toBeLessThanOrEqual(
      (geometry.scrollViewportBottom as number) - 8
    );
    expect(geometry.definitionScrollWidth).toBeLessThanOrEqual(
      geometry.definitionClientWidth + 1
    );
    expect(geometry.definitionScrollHeight).toBeLessThanOrEqual(
      geometry.definitionClientHeight + 1
    );
    expect(geometry.historyRight).not.toBeNull();
    expect(
      Math.abs((geometry.historyRight as number) - closedGeometry.historyRight)
    ).toBeLessThanOrEqual(1);
    expect(closedGeometry.scrollViewportScrollWidth).toBeLessThanOrEqual(
      closedGeometry.scrollViewportClientWidth + 1
    );
    expect(geometry.scrollViewportClientWidth).not.toBeNull();
    expect(geometry.scrollViewportScrollWidth).not.toBeNull();
    expect(geometry.scrollViewportScrollWidth as number).toBeLessThanOrEqual(
      (geometry.scrollViewportClientWidth as number) + 1
    );
    expect(geometry.overlayClientWidth).not.toBeNull();
    expect(geometry.overlayScrollWidth).not.toBeNull();
    expect(geometry.overlayScrollWidth as number).toBeLessThanOrEqual(
      (geometry.overlayClientWidth as number) + 1
    );
    expect(geometry.scrollViewportScrollLeft).toBe(0);

    await page.waitForTimeout(200);

    const relativeTopBeforeScroll = await page.evaluate(() => {
      const definition = document.querySelector(
        '.manuscript-marginalia-definition'
      );
      const segment = definition?.closest('.narrative-segment');

      if (!definition || !segment) {
        return null;
      }

      const definitionRect = definition.getBoundingClientRect();
      const segmentRect = segment.getBoundingClientRect();

      return Math.round(definitionRect.top - segmentRect.top);
    });

    await page.evaluate(() => {
      const scrollViewport = document.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement | null;

      if (!scrollViewport) {
        throw new Error('Expected history scroller');
      }

      scrollViewport.scrollTo({
        top: Math.max(0, scrollViewport.scrollTop - 24),
        behavior: 'auto',
      });
    });

    await page.waitForTimeout(50);

    const relativeTopAfterScroll = await page.evaluate(() => {
      const definition = document.querySelector(
        '.manuscript-marginalia-definition'
      );
      const segment = definition?.closest('.narrative-segment');

      if (!definition || !segment) {
        return null;
      }

      const definitionRect = definition.getBoundingClientRect();
      const segmentRect = segment.getBoundingClientRect();

      return Math.round(definitionRect.top - segmentRect.top);
    });

    expect(relativeTopBeforeScroll).not.toBeNull();
    expect(relativeTopAfterScroll).not.toBeNull();
    expect(
      Math.abs(
        (relativeTopAfterScroll as number) -
          (relativeTopBeforeScroll as number)
      )
    ).toBeLessThanOrEqual(1);
  });
});
