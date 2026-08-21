import { Page } from '@playwright/test';

export interface MockApiOptions {
  narrativeDelayMs?: number;
  choicesDelayMs?: number;
  endingDelayMs?: number;
}

const delay = async (milliseconds: number): Promise<void> => {
  if (milliseconds <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

/**
 * Mock API endpoints for deterministic visual tests
 *
 * This ensures visual tests don't fail due to API variability.
 * All AI-generated content is replaced with consistent, predictable responses.
 *
 * Usage:
 * ```typescript
 * await mockApiEndpoints(page);
 * await page.goto('/game-session');
 * // All AI endpoints now return consistent mock data
 * ```
 */
export async function mockApiEndpoints(
  page: Page,
  options: MockApiOptions = {},
): Promise<void> {
  console.log('Setting up API endpoint mocks...');
  const {
    narrativeDelayMs = 0,
    choicesDelayMs = 0,
    endingDelayMs = 0,
  } = options;

  // Mock narrative generation endpoint
  await page.route('**/api/narrative/generate', async (route) => {
    console.log(
      '🚫 Intercepted narrative generation API call - using mock data'
    );
    await delay(narrativeDelayMs);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        segment: {
          id: 'segment-mock-1',
          content:
            'Rain pelts the neon-soaked streets as you crouch behind a hover-car. The building looms ahead, its security algorithms pulsing like a digital heartbeat.',
          type: 'scene',
          characterIds: [],
          metadata: {
            mood: 'tense',
            location: 'City streets',
          },
        },
      }),
    });
  });

  // Mock choice generation endpoint
  await page.route('**/api/narrative/choices', async (route) => {
    console.log(
      '🚫 Intercepted narrative choices API call - using mock choices'
    );
    await delay(choicesDelayMs);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [
          {
            id: 'option-1',
            text: 'Proceed with caution',
            alignment: 'neutral',
            hint: 'A balanced approach',
          },
          {
            id: 'option-2',
            text: 'Rush forward boldly',
            alignment: 'chaotic',
            hint: 'High risk, high reward',
          },
          {
            id: 'option-3',
            text: 'Retreat and reassess',
            alignment: 'lawful',
            hint: 'Play it safe',
          },
        ],
      }),
    });
  });

  // Mock story checkpoint endpoint
  await page.route('**/api/narrative/story-checkpoint', async (route) => {
    console.log('🚫 Intercepted story checkpoint API call - using mock summary');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        segment:
          'A brief checkpoint summary captures the latest events with steady focus and forward momentum.',
        highlights: ['Checkpoint summary generated for visual tests.'],
        majorEvents: ['Key event recorded for checkpoint.'],
        includedEvents: 1,
        includedDecisions: 0,
        lastEventTimestamp: '2024-01-01T12:00:00.000Z',
        model: 'playwright-mock',
      }),
    });
  });

  // Mock journal summarize endpoint. The journal flow
  // (useActiveGameSessionJournal) calls this when narrative segments are added;
  // it's normally skipped under isPlaywrightEnv(), but a spec that renders the
  // session path without setting that flag would otherwise hit the live AI route,
  // hang the single CI dev server, and time out unrelated specs (#1342).
  await page.route('**/api/narrative/summarize', async (route) => {
    console.log('🚫 Intercepted journal summarize API call - using mock summary');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: 'The character advanced through the latest events.',
        entryType: 'character_event',
        significance: 'minor',
      }),
    });
  });

  // Mock world generation endpoint
  await page.route('**/api/generate-world', async (route) => {
    console.log('Intercepted generate-world API call');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Generated Test World',
        genre: 'Science Fiction',
        description: 'A test world generated for visual testing',
        attributes: [],
        skills: [],
        derivedStats: [],
        settings: {
          toneSettings: {
            complexity: 'medium',
            maturityLevel: 'teen',
            pacing: 'moderate',
            focusAreas: ['exploration'],
            narrativeStyle: 'adventure',
          },
        },
      }),
    });
  });

  // Mock character generation endpoint
  await page.route('**/api/generate-character', async (route) => {
    console.log('Intercepted generate-character API call');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Generated Test Character',
        concept: 'A test character for visual testing',
        background: 'Generated for testing purposes',
        personality: 'Consistent and reliable',
      }),
    });
  });

  // Mock world suggestion endpoint
  await page.route('**/api/world/suggest', async (route) => {
    console.log('Intercepted world suggestion API call');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        suggestions: [
          {
            name: 'Cyberpunk Dystopia',
            genre: 'cyberpunk',
            description:
              'A gritty future where technology and humanity collide',
          },
          {
            name: 'Epic Fantasy Realm',
            genre: 'fantasy',
            description: 'A magical world of dragons and ancient powers',
          },
        ],
      }),
    });
  });

  // Mock ending generation endpoint
  await page.route('**/api/narrative/ending', async (route) => {
    console.log('Intercepted ending generation API call');
    await delay(endingDelayMs);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ending: {
          text: 'Your journey comes to a close as the sun sets on the horizon.',
          tone: 'neutral',
          achievements: [],
        },
      }),
    });
  });

  // Mock image generation endpoints (return placeholder)
  await page.route('**/api/generate-*-image', async (route) => {
    console.log('Intercepted image generation API call');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        imageUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/awp2z0AAAAASUVORK5CYII=',
      }),
    });
  });

  // Mock world analysis endpoint
  await page.route('**/api/ai/analyze-world', async (route) => {
    console.log('Intercepted world analysis API call');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        attributes: [
          { name: 'Cybernetics', description: 'Integration with tech', minValue: 1, maxValue: 10, baseValue: 5 },
          { name: 'Hacking', description: 'Digital intrusion skills', minValue: 1, maxValue: 10, baseValue: 5 },
          { name: 'Reflexes', description: 'Combat reaction speed', minValue: 1, maxValue: 10, baseValue: 5 },
          { name: 'Street Cred', description: 'Social standing in the underworld', minValue: 1, maxValue: 10, baseValue: 5 },
        ],
        skills: [
          { name: 'Netrunning', description: 'Navigating cyberspace', difficulty: 'hard', linkedAttributeNames: ['Hacking'] },
          { name: 'Pistols', description: 'Handgun combat', difficulty: 'medium', linkedAttributeNames: ['Reflexes'] },
          { name: 'Stealth', description: 'Moving unseen', difficulty: 'medium', linkedAttributeNames: ['Reflexes'] },
          { name: 'Negotiation', description: 'Social engineering', difficulty: 'medium', linkedAttributeNames: ['Street Cred'] },
        ],
      }),
    });
  });

  console.log('✅ API endpoints mocked for deterministic testing');
}

/**
 * Mock specific narrative endpoint with custom response
 */
export async function mockNarrativeResponse(
  page: Page,
  response: { content: string; type: string }
): Promise<void> {
  await page.route('**/api/narrative/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        segment: {
          id: 'segment-custom',
          content: response.content,
          type: response.type,
          characterIds: [],
          metadata: {},
        },
      }),
    });
  });
}

/**
 * Mock error response for testing error states
 */
export async function mockApiError(
  page: Page,
  endpoint: string,
  errorMessage: string = 'Server error'
): Promise<void> {
  await page.route(endpoint, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: errorMessage,
      }),
    });
  });
}
