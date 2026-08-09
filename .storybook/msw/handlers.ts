// Default MSW handlers for Storybook (issue #1485).
//
// Storybook is the canonical, backend-free view of the frontend. These handlers
// intercept the app's AI/HTTP generation routes so page and organism stories
// render without ever touching the real network or a player's provider key.
// Payloads are deterministic and structurally valid — enough for components to
// render a happy path, not faithful AI prose. A story that needs a richer or a
// failing response overrides these per-story via `parameters.msw.handlers`.
//
// The app's own parsers (e.g. choiceGenerator.parser + its fallback) tolerate
// imperfect content, so these stay intentionally minimal.

import { http, HttpResponse } from 'msw';

// Text-generation routes share one response contract: { content, finishReason }.
// See src/utils/apiHelpers.ts (processGeminiTextRequest) and the client reader
// in src/lib/ai/clientGeminiClient.ts.
const textResponse = (content: string) =>
  HttpResponse.json({
    content,
    finishReason: 'STOP',
    promptTokens: 0,
    completionTokens: 0,
  });

// /api/narrative/generate alone streams newline-delimited JSON (issue #1476)
// instead of the single-JSON shape above — see processGeminiStreamingTextRequest
// and ClientGeminiClient.generateContent's ndjson reader. One line is a valid
// stream: just the terminal `done` event, carrying the same fields.
const streamingTextResponse = (content: string) =>
  new HttpResponse(
    `${JSON.stringify({
      done: true,
      content,
      finishReason: 'STOP',
      promptTokens: 0,
      completionTokens: 0,
    })}\n`,
    { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' } }
  );

const CANNED_NARRATIVE =
  'The corridor opens into a vaulted hall. Dust hangs in the lantern light, ' +
  'and somewhere ahead water drips in a slow, deliberate rhythm. You sense ' +
  'you are not the first to stand here, nor the first to hesitate.';

// Loose text format the choice parser understands; the parser falls back to
// sensible defaults if this ever drifts, so it never crashes a story.
const CANNED_CHOICES = [
  'Decision Weight: Minor',
  '',
  '1. Press deeper into the hall',
  '2. Hold your position and listen',
  '3. Raise the lantern and call out',
  '4. Retreat the way you came',
].join('\n');

const placeholderImage = (seed: string) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}`;

export const handlers = [
  // --- Narrative text routes ---
  http.post('/api/narrative/generate', () => streamingTextResponse(CANNED_NARRATIVE)),
  http.post('/api/narrative/choices', () => textResponse(CANNED_CHOICES)),
  http.post('/api/narrative/ending', () => textResponse(CANNED_NARRATIVE)),
  http.post('/api/narrative/summarize', () => textResponse('A brief recap of events so far.')),
  http.post('/api/narrative/story-checkpoint', () => textResponse('Checkpoint reached.')),
  http.post('/api/narrative/validate-event-significance', () =>
    textResponse('minor'),
  ),

  // --- Other AI text routes ---
  http.post('/api/ai/analyze-world', () => textResponse('A balanced, story-rich world.')),
  http.post('/api/ai/validate-provider', () =>
    HttpResponse.json({
      valid: true,
      capabilities: { text: true, images: true, streaming: true },
      model: 'mock-model',
    }),
  ),
  http.post('/api/inventory/categorize', () => textResponse('general')),
  http.post('/api/inventory/check-similarity', () => textResponse('false')),

  // --- Structured generation routes (return the entity directly) ---
  http.post('/api/generate-world', () =>
    HttpResponse.json({
      name: 'The Mock Reaches',
      description: 'A deterministic world used for Storybook rendering.',
      genre: 'fantasy',
      attributes: [],
      skills: [],
    }),
  ),
  http.post('/api/generate-character', () =>
    HttpResponse.json({
      name: 'Mock Wanderer',
      description: 'A deterministic character used for Storybook rendering.',
      level: 1,
      attributes: [],
      skills: [],
    }),
  ),

  // --- Image routes ---
  http.post('/api/generate-portrait', () =>
    HttpResponse.json({
      portrait: {
        type: 'ai-generated',
        url: placeholderImage('portrait'),
        generatedAt: new Date(0).toISOString(),
        prompt: 'Mock portrait',
      },
    }),
  ),
  http.post('/api/generate-world-image', () =>
    HttpResponse.json({
      imageUrl: placeholderImage('world'),
      description: 'Mock world image',
      aiGenerated: false,
      placeholder: true,
    }),
  ),
  http.post('/api/generate-item-image', () =>
    HttpResponse.json({ imageUrl: placeholderImage('item'), aiGenerated: false, placeholder: true }),
  ),
  http.post('/api/generate-journal-image', () =>
    HttpResponse.json({ imageUrl: placeholderImage('journal'), aiGenerated: false, placeholder: true }),
  ),
  http.post('/api/generate-ending-image', () =>
    HttpResponse.json({ imageUrl: placeholderImage('ending'), aiGenerated: false, placeholder: true }),
  ),
  http.post('/api/delete-image', () => HttpResponse.json({ success: true })),
];
