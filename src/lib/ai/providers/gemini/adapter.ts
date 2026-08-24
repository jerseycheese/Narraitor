// src/lib/ai/providers/gemini/adapter.ts

import type {
  FinishReason,
  ProviderAdapter,
  ProviderDescriptor,
  ProviderParseResult,
  ProviderStreamFrame,
  TextGenerationSpec,
} from '../types';
import type { SafetySetting } from '../../types';
import type { ContentRating } from '../../safety/contentRatingGuidance';
import { applyGeminiPromptOverrides } from '../promptOverrides';

/**
 * Gemini's native REST API, behind the generic provider contract.
 *
 * This adapter is a straight lift of what `apiHelpers.ts` did inline before the
 * split: same URLs, same body, same parsing, same defaults. The one
 * intentional difference is that finish reasons are normalized here rather than
 * passed through raw, so `AIResponse.finishReason` speaks one vocabulary
 * regardless of which provider produced it.
 */

/**
 * Gemini's base URL is a constant rather than `descriptor.endpoint`.
 *
 * SECURITY: the endpoint travels from the browser in a header, and the server
 * makes the outbound request. Pinning the one provider that every default
 * session uses means the common path has no attacker-reachable URL at all;
 * only an explicitly-configured OpenAI-compatible provider can steer the
 * destination, and that path runs through the endpoint guard.
 */
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Harm categories are always sent in this order; per-rating thresholds line up by index.
const HARM_CATEGORIES = [
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
] as const;

const MEDIUM = 'BLOCK_MEDIUM_AND_ABOVE';
const HIGH = 'BLOCK_ONLY_HIGH';
const NONE = 'BLOCK_NONE';

// Thresholds per content rating, ordered [sexual, hate, harassment, dangerous].
const RATING_THRESHOLDS: Record<ContentRating, readonly [string, string, string, string]> = {
  g: [MEDIUM, MEDIUM, MEDIUM, MEDIUM],
  pg: [HIGH, HIGH, HIGH, HIGH],
  'pg-13': [HIGH, HIGH, HIGH, HIGH],
  r: [NONE, HIGH, HIGH, HIGH],
  'nc-17': [NONE, HIGH, NONE, HIGH],
};

const DEFAULT_THRESHOLDS: readonly [string, string, string, string] = [MEDIUM, MEDIUM, MEDIUM, MEDIUM];

/** Gemini safety settings for a content rating; the conservative default when unrated. */
export function getSafetySettingsForRating(rating: ContentRating | null): SafetySetting[] {
  const thresholds = (rating && RATING_THRESHOLDS[rating]) ?? DEFAULT_THRESHOLDS;
  return HARM_CATEGORIES.map((category, index) => ({ category, threshold: thresholds[index] }));
}

/**
 * Gemini's finish reasons, mapped onto the normalized set. Anything Google adds
 * later (or that only appears on edge cases, like RECITATION) reports as OTHER
 * rather than leaking a provider-specific token downstream.
 */
const FINISH_REASONS: Record<string, FinishReason> = {
  STOP: 'STOP',
  MAX_TOKENS: 'MAX_TOKENS',
  SAFETY: 'SAFETY',
};

function normalizeFinishReason(raw: string | undefined): FinishReason {
  if (!raw) return 'STOP';
  return FINISH_REASONS[raw.toUpperCase()] ?? 'OTHER';
}

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
}

interface GeminiPayload {
  candidates?: GeminiCandidate[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

export const geminiAdapter: ProviderAdapter = {
  type: 'gemini',
  playerSuppliedEndpoint: false,

  buildUrl(descriptor: ProviderDescriptor, spec: TextGenerationSpec): string {
    const model = encodeURIComponent(descriptor.model);
    return spec.stream
      ? `${GEMINI_API_BASE}/${model}:streamGenerateContent?alt=sse`
      : `${GEMINI_API_BASE}/${model}:generateContent`;
  },

  buildHeaders(descriptor: ProviderDescriptor): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-goog-api-key': descriptor.apiKey ?? '',
    };
  },

  buildBody(descriptor: ProviderDescriptor, spec: TextGenerationSpec): object {
    return {
      contents: [{ parts: [{ text: applyGeminiPromptOverrides(spec.prompt, descriptor) }] }],
      generationConfig: {
        // Gemini has no reasoning-model preset that fixes sampling — unlike
        // the openai-compatible adapter, an override here is always safe to
        // send. See ProviderDescriptor.temperatureOverride.
        temperature: descriptor.temperatureOverride ?? spec.temperature,
        topP: descriptor.topPOverride ?? 1.0,
        topK: 40,
        maxOutputTokens: descriptor.maxTokensOverride ?? spec.maxTokens,
        // Disable gemini-2.5-flash dynamic thinking: it adds latency and eats
        // into the (small) maxOutputTokens budget meant for visible prose.
        thinkingConfig: { thinkingBudget: 0 },
      },
      safetySettings: getSafetySettingsForRating(spec.contentRating),
    };
  },

  parseTextResponse(data: unknown): ProviderParseResult {
    const payload = (data ?? {}) as GeminiPayload;
    const candidate = payload.candidates?.[0];

    // Exactly the pre-split condition: a response missing candidates, content,
    // or parts is malformed. Gemini reports a refusal by omitting the parts, so
    // this path covers moderation too — but it always has, and calling it
    // "malformed" is what every existing caller and test expects.
    if (!payload.candidates || !candidate || !candidate.content || !candidate.content.parts) {
      return { ok: false, failure: 'malformed' };
    }

    return {
      ok: true,
      result: {
        content: candidate.content.parts[0]?.text || '',
        finishReason: normalizeFinishReason(candidate.finishReason),
        promptTokens: payload.usageMetadata?.promptTokenCount || undefined,
        completionTokens: payload.usageMetadata?.candidatesTokenCount || undefined,
      },
    };
  },

  parseStreamFrame(payload: unknown): ProviderStreamFrame | null {
    const parsed = (payload ?? {}) as GeminiPayload;
    const candidate = parsed.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    return {
      text: typeof text === 'string' ? text : undefined,
      finishReason: candidate?.finishReason ? normalizeFinishReason(candidate.finishReason) : undefined,
      promptTokens: parsed.usageMetadata?.promptTokenCount,
      completionTokens: parsed.usageMetadata?.candidatesTokenCount,
    };
  },
};
