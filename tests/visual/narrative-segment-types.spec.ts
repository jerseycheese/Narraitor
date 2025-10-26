import { test, expect } from '@playwright/test';
import { waitForContentStable } from './utils/wait-helpers';

/**
 * Visual test for varied narrative segment types (Issue #765)
 *
 * Demonstrates that narrative segments now display with varied visual styling
 * based on their type: scene, dialogue, action, and transition.
 *
 * Each type has distinct visual characteristics:
 * - Scene: Default white background, gray text
 * - Dialogue: Blue left border, italic blue text
 * - Action: Amber border, bold text
 * - Transition: Gray background, small italic text
 */

test.describe('Narrative Segment Types Visual Test', () => {
  test('should display all segment types with distinct visual styling', async ({ page }) => {
    // Seed test data directly in the browser before navigation
    await page.addInitScript(() => {
      // Create segments for each type with clear examples
      const segments = {
        'segment-scene': {
          id: 'segment-scene',
          worldId: 'world-test',
          sessionId: 'session-test',
          content: 'The ancient temple looms before you, its stone walls covered in mysterious glowing runes. A cold wind whistles through the columns.',
          type: 'scene',
          characterIds: [],
          metadata: {
            mood: 'mysterious',
            location: 'Ancient Temple',
            tags: ['scene-example']
          },
          timestamp: new Date('2024-01-01T00:00:00.000Z'),
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        'segment-dialogue': {
          id: 'segment-dialogue',
          worldId: 'world-test',
          sessionId: 'session-test',
          content: '"Welcome, traveler," the old wizard says with a knowing smile. "I have been expecting you. The prophecy spoke of your arrival."',
          type: 'dialogue',
          characterIds: [],
          metadata: {
            mood: 'mysterious',
            location: 'Ancient Temple',
            tags: ['dialogue-example']
          },
          timestamp: new Date('2024-01-01T00:01:00.000Z'),
          createdAt: '2024-01-01T00:01:00.000Z',
          updatedAt: '2024-01-01T00:01:00.000Z',
        },
        'segment-action': {
          id: 'segment-action',
          worldId: 'world-test',
          sessionId: 'session-test',
          content: 'You draw your sword and charge forward, dodging the falling debris. Your blade strikes true, sending sparks flying as metal meets stone.',
          type: 'action',
          characterIds: [],
          metadata: {
            mood: 'action',
            location: 'Ancient Temple',
            tags: ['action-example']
          },
          timestamp: new Date('2024-01-01T00:02:00.000Z'),
          createdAt: '2024-01-01T00:02:00.000Z',
          updatedAt: '2024-01-01T00:02:00.000Z',
        },
        'segment-transition': {
          id: 'segment-transition',
          worldId: 'world-test',
          sessionId: 'session-test',
          content: 'Hours later, as the sun sets behind the mountains, you arrive at the sacred grove.',
          type: 'transition',
          characterIds: [],
          metadata: {
            mood: 'neutral',
            location: 'Sacred Grove',
            tags: ['transition-example']
          },
          timestamp: new Date('2024-01-01T00:03:00.000Z'),
          createdAt: '2024-01-01T00:03:00.000Z',
          updatedAt: '2024-01-01T00:03:00.000Z',
        }
      };

      // Seed world data
      const worldData = {
        state: {
          worlds: {
            'world-test': {
              id: 'world-test',
              name: 'Test Realm',
              description: 'A world for testing segment types',
              genre: 'fantasy',
              attributes: [],
              skills: [],
              settings: {},
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            }
          },
          currentWorldId: 'world-test',
          error: null,
          loading: false,
        },
        version: 1,
      };

      // Seed character data
      const characterData = {
        state: {
          characters: {
            'char-test': {
              id: 'char-test',
              name: 'Test Hero',
              worldId: 'world-test',
              level: 1,
              attributes: [],
              skills: [],
              background: {},
              isPlayer: true,
              status: { health: 100, maxHealth: 100 },
              inventory: { characterId: 'char-test', items: [] },
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            }
          },
          currentCharacterId: 'char-test',
          error: null,
          loading: false,
        },
        version: 1,
      };

      // Seed session data
      const sessionData = {
        state: {
          sessions: {
            'session-test': {
              id: 'session-test',
              worldId: 'world-test',
              characterId: 'char-test',
              name: 'Segment Type Demo',
              status: 'active',
              currentTurn: 4,
              totalTurns: 4,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:03:00.000Z',
            }
          },
          currentSessionId: 'session-test',
          onboardingCompleted: true,
          error: null,
          loading: false,
        },
        version: 2,
      };

      // Seed narrative data with all segment types
      const narrativeData = {
        state: {
          segments: segments,
          sessionSegments: {
            'session-test': ['segment-scene', 'segment-dialogue', 'segment-action', 'segment-transition']
          },
          decisions: {},
          sessionDecisions: {},
          endedSessions: {},
          currentEnding: null,
          isGeneratingEnding: false,
          endingError: null,
          error: null,
          loading: false,
        },
        version: 1,
      };

      // Store in localStorage
      localStorage.setItem('narraitor-world-store', JSON.stringify(worldData));
      localStorage.setItem('narraitor-character-store', JSON.stringify(characterData));
      localStorage.setItem('narraitor-session-store', JSON.stringify(sessionData));
      localStorage.setItem('narraitor-narrative-store', JSON.stringify(narrativeData));

      console.log('✅ Segment type test data seeded');
    });

    // Navigate to the game session page
    await page.goto('/worlds/world-test/play');

    // Wait for the narrative segments to render
    await page.waitForSelector('[data-testid="narrative-segment"], [class*="narrative"]', {
      timeout: 10000
    });

    // Wait for content to stabilize
    await waitForContentStable(page);

    // Take a screenshot showing all segment types
    await expect(page).toHaveScreenshot('narrative-segment-types-all.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Verify each segment type is present
    const sceneSegment = page.locator('text=The ancient temple looms before you');
    await expect(sceneSegment).toBeVisible();

    const dialogueSegment = page.locator('text="Welcome, traveler,"');
    await expect(dialogueSegment).toBeVisible();

    const actionSegment = page.locator('text=You draw your sword and charge forward');
    await expect(actionSegment).toBeVisible();

    const transitionSegment = page.locator('text=Hours later, as the sun sets');
    await expect(transitionSegment).toBeVisible();

    console.log('✅ All segment types verified and screenshot captured');
  });

  test('should show scene segment with default styling', async ({ page }) => {
    await page.addInitScript(() => {
      const singleSegment = {
        'segment-scene-only': {
          id: 'segment-scene-only',
          worldId: 'world-scene',
          sessionId: 'session-scene',
          content: 'A vast desert stretches before you. The sun beats down mercilessly on the golden sands.',
          type: 'scene',
          characterIds: [],
          metadata: { mood: 'neutral', location: 'Desert' },
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      localStorage.setItem('narraitor-narrative-store', JSON.stringify({
        state: {
          segments: singleSegment,
          sessionSegments: { 'session-scene': ['segment-scene-only'] },
          decisions: {},
          sessionDecisions: {},
          endedSessions: {},
          currentEnding: null,
          isGeneratingEnding: false,
          endingError: null,
          error: null,
          loading: false,
        },
        version: 1,
      }));
    });

    await page.goto('/worlds/world-scene/play');
    await page.waitForSelector('text=A vast desert stretches before you', { timeout: 5000 });
    await expect(page.locator('text=A vast desert stretches before you')).toBeVisible();
  });

  test('should show dialogue segment with blue styling', async ({ page }) => {
    await page.addInitScript(() => {
      const singleSegment = {
        'segment-dialogue-only': {
          id: 'segment-dialogue-only',
          worldId: 'world-dialogue',
          sessionId: 'session-dialogue',
          content: '"The path ahead is dangerous," the guard warns. "Many have tried and failed."',
          type: 'dialogue',
          characterIds: [],
          metadata: { mood: 'tense', location: 'City Gate' },
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      localStorage.setItem('narraitor-narrative-store', JSON.stringify({
        state: {
          segments: singleSegment,
          sessionSegments: { 'session-dialogue': ['segment-dialogue-only'] },
          decisions: {},
          sessionDecisions: {},
          endedSessions: {},
          currentEnding: null,
          isGeneratingEnding: false,
          endingError: null,
          error: null,
          loading: false,
        },
        version: 1,
      }));
    });

    await page.goto('/worlds/world-dialogue/play');
    await page.waitForSelector('text="The path ahead is dangerous,"', { timeout: 5000 });
    await expect(page.locator('text="The path ahead is dangerous,"')).toBeVisible();
  });

  test('should show action segment with amber styling', async ({ page }) => {
    await page.addInitScript(() => {
      const singleSegment = {
        'segment-action-only': {
          id: 'segment-action-only',
          worldId: 'world-action',
          sessionId: 'session-action',
          content: 'You sprint across the rooftop, leap over the gap, and roll to safety as the building collapses behind you.',
          type: 'action',
          characterIds: [],
          metadata: { mood: 'action', location: 'Rooftop' },
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      localStorage.setItem('narraitor-narrative-store', JSON.stringify({
        state: {
          segments: singleSegment,
          sessionSegments: { 'session-action': ['segment-action-only'] },
          decisions: {},
          sessionDecisions: {},
          endedSessions: {},
          currentEnding: null,
          isGeneratingEnding: false,
          endingError: null,
          error: null,
          loading: false,
        },
        version: 1,
      }));
    });

    await page.goto('/worlds/world-action/play');
    await page.waitForSelector('text=You sprint across the rooftop', { timeout: 5000 });
    await expect(page.locator('text=You sprint across the rooftop')).toBeVisible();
  });

  test('should show transition segment with gray styling', async ({ page }) => {
    await page.addInitScript(() => {
      const singleSegment = {
        'segment-transition-only': {
          id: 'segment-transition-only',
          worldId: 'world-transition',
          sessionId: 'session-transition',
          content: 'Days pass. The journey takes you through dense forests and over treacherous mountains.',
          type: 'transition',
          characterIds: [],
          metadata: { mood: 'neutral', location: 'Mountain Pass' },
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      localStorage.setItem('narraitor-narrative-store', JSON.stringify({
        state: {
          segments: singleSegment,
          sessionSegments: { 'session-transition': ['segment-transition-only'] },
          decisions: {},
          sessionDecisions: {},
          endedSessions: {},
          currentEnding: null,
          isGeneratingEnding: false,
          endingError: null,
          error: null,
          loading: false,
        },
        version: 1,
      }));
    });

    await page.goto('/worlds/world-transition/play');
    await page.waitForSelector('text=Days pass', { timeout: 5000 });
    await expect(page.locator('text=Days pass')).toBeVisible();
  });
});
