// src/lib/ai/providers/claude/adapter.ts

import { REFUSAL_FINISH_REASONS } from '../types';
import type {
  FinishReason,
  ProviderAdapter,
  ProviderDescriptor,
  ProviderParseResult,
  ProviderStreamFrame,
  TextGenerationSpec,
} from '../types';
import { buildProviderSystemPrompt } from '../promptOverrides';

/**
 * Anthropic's native Messages API, behind the generic provider contract.
 *
 * Plain `fetch` against `api.anthropic.com` — no `@anthropic-ai/sdk` dependency.
 * Claude's wire shape is neither Gemini's nor the OpenAI-compatible standard:
 * the system prompt is a dedicated top-level field rather than a message
 * (see buildProviderSystemPrompt, shared with the openai-compatible adapter for
 * the content-rating guidance underneath it), and content comes back as an
 * array of typed blocks rather than a single string. See adapterRegistry.ts for
 * why Claude needed its own adapter instead of reusing the OpenAI-compatible one.
 *
 * The endpoint is pinned the same way Gemini's is (`playerSuppliedEndpoint:
 * false`): every session that picks this preset talks to the same Anthropic
 * URL, so there is nothing for a header to steer.
 */

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1/messages';

/**
 * Pinned rather than read off the descriptor. Anthropic dates this header, not
 * the SDK, so a version bump here is deliberate — not something a preset or a
 * header should be able to change.
 */
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Claude's stop reasons, mapped onto the normalized set. `refusal` is a
 * policy decline (HTTP 200, empty or near-empty content) — paired with
 * REFUSAL_FINISH_REASONS below, that is what turns a declined turn into a
 * named moderation failure instead of a blank story beat.
 */
const FINISH_REASONS: Record<string, FinishReason> = {
  end_turn: 'STOP',
  stop_sequence: 'STOP',
  max_tokens: 'MAX_TOKENS',
  refusal: 'SAFETY',
};

function normalizeFinishReason(raw: string | undefined | null): FinishReason {
  if (!raw) return 'STOP';
  return FINISH_REASONS[raw] ?? 'OTHER';
}

/** Claude's Messages API only accepts 0.0 through 1.0. */
function clampClaudeTemperature(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

interface ClaudeContentBlock {
  type?: string;
  text?: string;
}

interface ClaudePayload {
  content?: ClaudeContentBlock[];
  stop_reason?: string | null;
  usage?: { input_tokens?: number; output_tokens?: number };
}

/** Concatenate every text block — Claude can return more than one. */
function textFromContent(content: ClaudeContentBlock[] | undefined): string {
  if (!content) return '';
  return content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('');
}

interface ClaudeStreamEvent {
  type?: string;
  delta?: { type?: string; text?: string; stop_reason?: string | null };
  message?: { usage?: { input_tokens?: number } };
  usage?: { output_tokens?: number };
}

export const claudeAdapter: ProviderAdapter = {
  type: 'claude',
  playerSuppliedEndpoint: false,

  buildUrl(): string {
    return ANTHROPIC_API_BASE;
  },

  buildHeaders(descriptor: ProviderDescriptor): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': descriptor.apiKey ?? '',
      'anthropic-version': ANTHROPIC_VERSION,
    };
  },

  buildBody(descriptor: ProviderDescriptor, spec: TextGenerationSpec): object {
    return {
      model: descriptor.model,
      max_tokens: descriptor.maxTokensOverride ?? spec.maxTokens,
      // The system prompt is its own top-level field on this API, not a
      // message — unlike the OpenAI-compatible shape, there is no
      // no-system-role model family to fold it into the user turn for.
      system: buildProviderSystemPrompt(descriptor, spec.contentRating),
      messages: [{ role: 'user', content: spec.prompt }],
      // Claude has no reasoning-tier preset that fixes sampling — same
      // reasoning as the Gemini adapter, an override here is always safe to
      // send. hasFixedSamplingControls stays honored for a future preset that
      // needs it.
      ...(descriptor.hasFixedSamplingControls
        ? {}
        : {
            // Unlike Gemini and the OpenAI-compatible services, which take
            // temperature up to 2.0, Claude's Messages API rejects anything
            // above 1.0 with a 400 — the shared advanced-settings panel
            // doesn't know that, so a player-configured override needs
            // clamping here rather than trusted as-is.
            temperature: clampClaudeTemperature(descriptor.temperatureOverride ?? spec.temperature),
            top_p: descriptor.topPOverride ?? 1.0,
          }),
      ...(spec.stream ? { stream: true } : {}),
    };
  },

  parseTextResponse(data: unknown): ProviderParseResult {
    const payload = (data ?? {}) as ClaudePayload;

    if (!payload.content) {
      return { ok: false, failure: 'malformed' };
    }

    const content = textFromContent(payload.content);
    const finishReason = normalizeFinishReason(payload.stop_reason);

    // Claude's refusal responses (see the docs on stop_reason "refusal") come
    // back as a well-formed 200 with little or no text — indistinguishable
    // from a model that legitimately said nothing unless it's named here.
    if (!content && REFUSAL_FINISH_REASONS.has(finishReason)) {
      return { ok: false, failure: 'moderation' };
    }

    return {
      ok: true,
      result: {
        content,
        finishReason,
        promptTokens: payload.usage?.input_tokens || undefined,
        completionTokens: payload.usage?.output_tokens || undefined,
      },
    };
  },

  parseStreamFrame(payload: unknown): ProviderStreamFrame | null {
    const parsed = (payload ?? {}) as ClaudeStreamEvent;

    switch (parsed.type) {
      case 'content_block_delta':
        return typeof parsed.delta?.text === 'string' ? { text: parsed.delta.text } : null;

      case 'message_start':
        return parsed.message?.usage?.input_tokens !== undefined
          ? { promptTokens: parsed.message.usage.input_tokens }
          : null;

      case 'message_delta':
        return {
          finishReason: parsed.delta?.stop_reason
            ? normalizeFinishReason(parsed.delta.stop_reason)
            : undefined,
          completionTokens: parsed.usage?.output_tokens,
        };

      // Anthropic sends this after the SSE response has already opened
      // (e.g. a transient overload) instead of an HTTP error status. Mapped
      // onto the shared ERROR finish reason so the generic stream consumer
      // surfaces it as a stream error instead of a silent `done` with
      // whatever partial content happened to arrive.
      case 'error':
        return { finishReason: 'ERROR' };

      // message_stop, content_block_start/stop, ping: nothing these carry
      // reaches the narrative stream.
      default:
        return null;
    }
  },
};
