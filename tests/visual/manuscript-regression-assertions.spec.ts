import { test, expect } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

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
});
