import { consumeProviderStreamEvents } from '../core/streamConsumer';
import { geminiAdapter } from '../gemini/adapter';
import { openAICompatibleAdapter } from '../openai-compatible/adapter';
import type { NarrativeStreamEvent } from '../../types';

const encoder = new TextEncoder();

/** A reader that yields one SSE frame per read(), then signals done. */
function fakeReader(payloads: unknown[]) {
  const frames = payloads.map((payload) => encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
  let index = 0;
  return {
    read: async () => (index >= frames.length ? { done: true } : { done: false, value: frames[index++] }),
  };
}

async function collect(
  reader: { read(): Promise<{ done: boolean; value?: Uint8Array }> },
  adapter: typeof geminiAdapter
): Promise<NarrativeStreamEvent[]> {
  const events: NarrativeStreamEvent[] = [];
  for await (const event of consumeProviderStreamEvents(reader, adapter, 'Test')) {
    events.push(event);
  }
  return events;
}

function revealedText(events: NarrativeStreamEvent[]): string {
  return events
    .filter((event): event is { delta: string } => 'delta' in event)
    .map((event) => event.delta)
    .join('');
}

/**
 * The two halves of one story turn, split the way a real stream splits it.
 * Both providers stream the same JSON payload; only the frame shape differs.
 */
const CHUNKS = ['{"content": "Once upon a ', 'time, a hero arose.", "type": "scene"}'];
const WHOLE = CHUNKS.join('');

describe('consumeProviderStreamEvents', () => {
  it('reveals content from Gemini native frames', async () => {
    const events = await collect(
      fakeReader([
        { candidates: [{ content: { parts: [{ text: CHUNKS[0] }] } }] },
        {
          candidates: [{ content: { parts: [{ text: CHUNKS[1] }] }, finishReason: 'STOP' }],
          usageMetadata: { promptTokenCount: 30, candidatesTokenCount: 63 },
        },
      ]),
      geminiAdapter
    );

    expect(revealedText(events)).toBe('Once upon a time, a hero arose.');
    expect(events[events.length - 1]).toEqual({
      done: true,
      content: WHOLE,
      finishReason: 'STOP',
      promptTokens: 30,
      completionTokens: 63,
    });
  });

  /**
   * The regression the #1749 spike found: replaying real compatibility-endpoint
   * frames through the Gemini consumer produced 0 deltas and an empty done
   * event with finishReason "STOP" — indistinguishable downstream from a model
   * that legitimately returned nothing. With the frame extractor behind the
   * adapter, the same bytes reveal the same prose the native path does.
   */
  it('reveals the same content from OpenAI-compatible frames', async () => {
    const events = await collect(
      fakeReader([
        { choices: [{ delta: { content: CHUNKS[0] } }] },
        {
          choices: [{ delta: { content: CHUNKS[1] }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 30, completion_tokens: 63 },
        },
      ]),
      openAICompatibleAdapter
    );

    expect(revealedText(events)).toBe('Once upon a time, a hero arose.');
    expect(events[events.length - 1]).toEqual({
      done: true,
      content: WHOLE,
      // Lowercase "stop" upstream, one vocabulary downstream.
      finishReason: 'STOP',
      promptTokens: 30,
      completionTokens: 63,
    });
  });

  it('holds a frame back until the bytes completing it arrive', async () => {
    // The compat endpoint's first live call split a frame across chunks of
    // 327/485/6/8 bytes, so mid-frame boundaries are the normal case.
    const whole = `data: ${JSON.stringify({ choices: [{ delta: { content: WHOLE }, finish_reason: 'stop' }] })}\n\n`;
    const split = [whole.slice(0, 20), whole.slice(20)].map((part) => encoder.encode(part));
    let index = 0;

    const events = await collect(
      { read: async () => (index >= split.length ? { done: true } : { done: false, value: split[index++] }) },
      openAICompatibleAdapter
    );

    expect(revealedText(events)).toBe('Once upon a time, a hero arose.');
  });

  /**
   * A refusal ends the stream indistinguishable from a successful empty turn.
   * Emitting `done` with an empty string sends it downstream to
   * parseNarrativeResponse, which reports a malformed response — an error about
   * our own parsing for something that was the provider declining.
   */
  it.each([
    ['content_filter', 'SAFETY'],
    ['error', 'ERROR'],
  ])('reports a %s refusal as an error, not an empty done event', async (finishReason) => {
    const events = await collect(
      fakeReader([{ choices: [{ delta: { content: '' }, finish_reason: finishReason }] }]),
      openAICompatibleAdapter
    );

    expect(events).toEqual([{ error: 'The provider blocked this content' }]);
  });

  it('still reports a refusal that produced partial prose as a normal turn', async () => {
    // Partial content is worth keeping; only a wholly empty refusal is an error.
    const events = await collect(
      fakeReader([
        { choices: [{ delta: { content: '{"content": "A door opens.' } }] },
        { choices: [{ delta: { content: '"}' }, finish_reason: 'content_filter' }] },
      ]),
      openAICompatibleAdapter
    );

    expect(events[events.length - 1]).toMatchObject({ done: true, finishReason: 'SAFETY' });
  });

  it('skips the [DONE] sentinel the compatibility endpoint sends', async () => {
    const frames = [
      encoder.encode(
        `data: ${JSON.stringify({ choices: [{ delta: { content: WHOLE }, finish_reason: 'stop' }] })}\n\n`
      ),
      encoder.encode('data: [DONE]\n\n'),
    ];
    let index = 0;

    const events = await collect(
      { read: async () => (index >= frames.length ? { done: true } : { done: false, value: frames[index++] }) },
      openAICompatibleAdapter
    );

    expect(events[events.length - 1]).toMatchObject({ done: true, content: WHOLE });
  });
});
