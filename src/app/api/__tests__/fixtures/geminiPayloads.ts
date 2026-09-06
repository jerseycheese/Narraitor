// src/app/api/__tests__/fixtures/geminiPayloads.ts

/**
 * Upstream payloads in the shapes Gemini's REST API returns.
 *
 * PROVENANCE: hand-built from the contract the Gemini adapter parses
 * (`providers/gemini/adapter.ts` — `parseTextResponse` reads
 * `candidates[0].content.parts[0].text`, `parseStreamFrame` reads the same path
 * per SSE frame) and from the payloads already asserted in
 * `providers/__tests__/adapters.test.ts` and `streamConsumer.test.ts`.
 *
 * They are NOT captured from a live call. That means they assert what we
 * believe Gemini returns rather than what it does return, and they cannot
 * notice the provider changing its response shape. Capturing them against a
 * real key, and keeping them honest afterwards, is what the on-demand live tier
 * is for.
 */

interface GeminiPayloadOptions {
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
}

/** One complete non-streaming Gemini response carrying `text`. */
export function geminiTextPayload(text: string, options: GeminiPayloadOptions = {}) {
  const {
    finishReason = 'STOP',
    promptTokens = 128,
    completionTokens = 64,
  } = options;

  return {
    candidates: [
      {
        content: { parts: [{ text }] },
        finishReason,
      },
    ],
    usageMetadata: {
      promptTokenCount: promptTokens,
      candidatesTokenCount: completionTokens,
    },
  };
}

/** A response Gemini gives when it declines: candidates present, parts absent. */
export const GEMINI_REFUSAL_PAYLOAD = {
  candidates: [{ content: {}, finishReason: 'SAFETY' }],
};

/** SSE frames that spell out `text` one piece at a time, then report the finish. */
export function geminiStreamFrames(pieces: string[], options: GeminiPayloadOptions = {}) {
  const { finishReason = 'STOP', promptTokens = 128, completionTokens = 64 } = options;

  const frames: unknown[] = pieces.map((piece) => ({
    candidates: [{ content: { parts: [{ text: piece }] } }],
  }));

  frames.push({
    candidates: [{ content: { parts: [{ text: '' }] }, finishReason }],
    usageMetadata: {
      promptTokenCount: promptTokens,
      candidatesTokenCount: completionTokens,
    },
  });

  return frames;
}

/**
 * The response shape behind the dotted-key metadata dump: the model answers
 * with its metadata flattened into `key: value` pairs instead of JSON, and the
 * prose buried among them. The parse layer recovers the prose; what this
 * fixture is here to prove is that the string reaches that layer intact through
 * the route, the adapter and the stream framing.
 */
export const FLATTENED_METADATA_DUMP =
  'metadata.characterIds: [] metadata.speakerId: null metadata.location: "Ruins" metadata.mood: "grim" content: "Panic claws at your throat as the shadow lunges forward." type: action';
