// src/lib/ai/providers/openai-compatible/adapter.ts

import { REFUSAL_FINISH_REASONS } from '../types';
import type {
  FinishReason,
  ProviderAdapter,
  ProviderDescriptor,
  ProviderParseResult,
  ProviderStreamFrame,
  TextGenerationSpec,
} from '../types';
import { hasSystemRole } from '../capabilities';
import { getContentRatingGuidance } from '../../safety/contentRatingGuidance';

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

/**
 * The OpenAI chat-completions shape, which every provider in `presets.ts`
 * except Gemini speaks.
 *
 * One adapter covers all of them because the difference that matters is
 * per-model rather than per-vendor: whether the model takes a system role (see
 * capabilities). Anything a single vendor needs on top of this belongs in its
 * own adapter, not in a branch here.
 */

/**
 * Finish reasons, mapped onto the normalized set.
 *
 * `error` is here because OpenRouter reports a Gemini safety block that way
 * rather than as `content_filter` — a well-formed 200 with empty content, which
 * is indistinguishable from a model that legitimately said nothing unless the
 * adapter names it.
 */
const FINISH_REASONS: Record<string, FinishReason> = {
  stop: 'STOP',
  length: 'MAX_TOKENS',
  content_filter: 'SAFETY',
  error: 'ERROR',
};

function normalizeFinishReason(raw: string | undefined): FinishReason {
  if (!raw) return 'STOP';
  return FINISH_REASONS[raw.toLowerCase()] ?? 'OTHER';
}

interface OpenAIChoice {
  message?: { content?: string | null };
  delta?: { content?: string | null };
  finish_reason?: string | null;
}

interface OpenAIPayload {
  choices?: OpenAIChoice[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/**
 * The messages for one generation.
 *
 * Narraitor builds a single self-contained prompt per turn (world, character,
 * and recent narrative are all composed into it upstream), so there is one user
 * turn. The system turn carries the content-rating guidance, which is the only
 * thing this provider family can be told about a world's rating — it has no
 * safety-settings equivalent. A model with no system role gets the guidance
 * folded into the user turn instead: the role is lost, the instruction is not.
 */
function buildMessages(descriptor: ProviderDescriptor, spec: TextGenerationSpec): ChatMessage[] {
  const guidance = getContentRatingGuidance(spec.contentRating);

  return hasSystemRole(descriptor.model)
    ? [
        { role: 'system', content: guidance },
        { role: 'user', content: spec.prompt },
      ]
    : [{ role: 'user', content: `${guidance}\n\n${spec.prompt}` }];
}

export const openAICompatibleAdapter: ProviderAdapter = {
  type: 'openai-compatible',
  playerSuppliedEndpoint: true,

  /**
   * The configured endpoint verbatim. Providers disagree on the path —
   * `/v1/chat/completions`, `/chat/completions`, or something custom — and
   * streaming is a body flag rather than a different route, so there is nothing
   * to construct. The URL is checked by the endpoint guard before it gets here.
   */
  buildUrl(descriptor: ProviderDescriptor): string {
    return descriptor.endpoint;
  },

  buildHeaders(descriptor: ProviderDescriptor): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${descriptor.apiKey ?? ''}`,
    };
  },

  buildBody(descriptor: ProviderDescriptor, spec: TextGenerationSpec): object {
    return {
      model: descriptor.model,
      messages: buildMessages(descriptor, spec),
      // OpenAI renamed this and now rejects the old name outright instead of
      // ignoring it, while the rest of the ecosystem still speaks max_tokens.
      // Both this and the sampling controls below travel on the descriptor
      // rather than being branched on here, so this stays one adapter over one
      // request shape.
      [descriptor.maxOutputTokensParam ?? 'max_tokens']: spec.maxTokens,
      // Omitted entirely, not sent at their defaults: a reasoning model rejects
      // the presence of these fields, not just values it dislikes.
      ...(descriptor.hasFixedSamplingControls
        ? {}
        : { temperature: spec.temperature, top_p: 1.0 }),
      ...(spec.stream
        ? {
            stream: true,
            // Without this the stream carries no token counts at all, and the
            // done event's usage fields would silently be undefined.
            stream_options: { include_usage: true },
          }
        : {}),
    };
  },

  parseTextResponse(data: unknown): ProviderParseResult {
    const payload = (data ?? {}) as OpenAIPayload;
    const choice = payload.choices?.[0];

    if (!payload.choices || !choice || !choice.message) {
      return { ok: false, failure: 'malformed' };
    }

    const content = choice.message.content ?? '';
    const finishReason = normalizeFinishReason(choice.finish_reason ?? undefined);

    // A refusal arrives as a 200 with nothing in it. Naming it here is the
    // difference between "the provider blocked this" and a blank story beat.
    if (!content && REFUSAL_FINISH_REASONS.has(finishReason)) {
      return { ok: false, failure: 'moderation' };
    }

    return {
      ok: true,
      result: {
        content,
        finishReason,
        promptTokens: payload.usage?.prompt_tokens || undefined,
        completionTokens: payload.usage?.completion_tokens || undefined,
      },
    };
  },

  parseStreamFrame(payload: unknown): ProviderStreamFrame | null {
    const parsed = (payload ?? {}) as OpenAIPayload;
    const choice = parsed.choices?.[0];
    const text = choice?.delta?.content;

    return {
      text: typeof text === 'string' ? text : undefined,
      finishReason: choice?.finish_reason ? normalizeFinishReason(choice.finish_reason) : undefined,
      // Where these ride depends on the service. OpenAI puts cumulative counts
      // on every chunk; Ollama sends one final frame carrying usage and an
      // empty `choices`, which is why the reads above are all optional. The
      // core's last-write-wins is the correct read for both.
      promptTokens: parsed.usage?.prompt_tokens,
      completionTokens: parsed.usage?.completion_tokens,
    };
  },
};
