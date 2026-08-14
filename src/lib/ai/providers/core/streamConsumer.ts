// src/lib/ai/providers/core/streamConsumer.ts

import { REFUSAL_FINISH_REASONS } from '../types';
import type { FinishReason, ProviderAdapter } from '../types';
import type { NarrativeStreamEvent } from '../../types';
import { extractStreamingContentPreview } from '../../narrativeStreamPreview';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ProviderStream');

/** Minimal shape needed to drive the SSE parser — matches a real
 * ReadableStreamDefaultReader<Uint8Array>, but kept structural so tests can
 * hand it a plain object instead of constructing a real web ReadableStream. */
export interface ByteStreamReader {
  read(): Promise<{ done: boolean; value?: Uint8Array }>;
}

/**
 * Consumes a provider's SSE response body and yields our own narrative
 * streaming protocol events (see NarrativeStreamEvent).
 *
 * Everything in this loop is provider-generic and stays here: the decode, the
 * partial-line buffer, the preview extraction, the monotonic-reveal guard, and
 * the event protocol. The adapter's only contribution is `parseStreamFrame`,
 * which maps one parsed `data:` payload to text and metadata.
 *
 * That line was chosen rather than assumed. A spike replayed real
 * network chunks from both Gemini endpoints and found the framing identical —
 * `200 text/event-stream`, `data:` prefixes, a `[DONE]` sentinel on one of them
 * — and only the payload inside each frame different. It also found buffering
 * genuinely required on both: the compatibility endpoint's chunks arrived at
 * 327, 485, 6 and 8 bytes, so a frame boundary landed mid-chunk on the first
 * live call.
 *
 * Each frame's text delta is accumulated into the raw buffer;
 * extractStreamingContentPreview recovers whatever of the "content" JSON field
 * is decodable so far, and only the newly-revealed suffix is yielded as a delta
 * — recomputing from scratch each time means a chunk that lands mid-escape-
 * sequence just withholds output until the next chunk resolves it, instead of
 * ever yielding a mangled character.
 *
 * Kept independent of the real ReadableStream/Response constructors (which
 * jsdom's jest environment doesn't provide) so it's unit-testable with a
 * hand-rolled reader.
 */
export async function* consumeProviderStreamEvents(
  reader: ByteStreamReader,
  adapter: ProviderAdapter,
  errorContext: string
): AsyncGenerator<NarrativeStreamEvent> {
  const decoder = new TextDecoder();
  let sseBuffer = '';
  let rawContent = '';
  let visiblePreview = '';
  let finishReason: FinishReason = 'STOP';
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      // The last element may be a partial line still being written — hold it
      // back in the buffer until more bytes complete it.
      sseBuffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice('data:'.length).trim();
        if (!payload || payload === '[DONE]') continue;

        let parsed: unknown;
        try {
          parsed = JSON.parse(payload);
        } catch {
          // An unparsable SSE frame is skipped rather than aborting the
          // whole turn — the next frame (or the final done event, built
          // from whatever text did arrive) carries the turn forward.
          continue;
        }

        const frame = adapter.parseStreamFrame(parsed);
        if (!frame) continue;

        if (typeof frame.text === 'string') {
          rawContent += frame.text;
          const nextPreview = extractStreamingContentPreview(rawContent);
          // Only ever emit a delta when the new preview grows the previous
          // one by appending characters. extractStreamingContentPreview is
          // recomputed from scratch each call and is meant to be monotonic,
          // but this guard keeps a future edge case there from slicing a
          // false prefix off content that never actually preceded it, which
          // would otherwise corrupt the reveal.
          if (
            nextPreview.length > visiblePreview.length &&
            nextPreview.startsWith(visiblePreview)
          ) {
            yield { delta: nextPreview.slice(visiblePreview.length) };
            visiblePreview = nextPreview;
          }
        }
        if (frame.finishReason) {
          finishReason = frame.finishReason;
        }
        // Last write wins. On Gemini the counts arrive once on the final
        // frame; on the OpenAI-compatible path they ride every frame and are
        // cumulative, so the latest is the complete one either way.
        if (frame.promptTokens !== undefined) promptTokens = frame.promptTokens;
        if (frame.completionTokens !== undefined) completionTokens = frame.completionTokens;
      }
    }

    // A refusal ends the stream looking exactly like a successful turn that
    // happened to produce nothing. Emitting `done` here would send an empty
    // string downstream, where parseNarrativeResponse reports it as a malformed
    // response — a misleading error about our own parsing for something that
    // was actually the provider declining. The non-streaming path names this
    // correctly (see the adapter's `moderation` parse failure); this is the
    // streaming half of the same call.
    if (!rawContent && REFUSAL_FINISH_REASONS.has(finishReason)) {
      yield { error: 'The provider blocked this content' };
      return;
    }

    yield {
      done: true,
      content: rawContent,
      finishReason,
      promptTokens,
      completionTokens,
    };
  } catch (error) {
    logger.error(`${errorContext} stream error:`, error);
    yield {
      error: error instanceof Error ? error.message : 'Stream interrupted',
    };
  }
}
