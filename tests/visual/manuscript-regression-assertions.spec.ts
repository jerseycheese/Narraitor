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
});
