import { ClientGeminiClient } from '../clientGeminiClient';
import { aiFetch } from '../aiFetch';

jest.mock('../aiFetch');

const mockedAiFetch = aiFetch as jest.MockedFunction<typeof aiFetch>;
const encoder = new TextEncoder();

/** A fake response.body whose reader yields the given ndjson lines as
 * separate chunks — matches the ReadableStreamDefaultReader shape without
 * needing a real web ReadableStream (unavailable in this jsdom test env). */
function fakeStreamingResponse(lines: string[]) {
  const chunks = lines.map((line) => encoder.encode(`${line}\n`));
  let index = 0;
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: jest.fn(async () => {
          if (index >= chunks.length) return { done: true, value: undefined };
          return { done: false, value: chunks[index++] };
        }),
      }),
    },
  };
}

describe('ClientGeminiClient.generateContent', () => {
  beforeEach(() => {
    mockedAiFetch.mockReset();
  });

  it('forwards each delta to onChunk as it streams and resolves with the done event', async () => {
    mockedAiFetch.mockResolvedValue(
      fakeStreamingResponse([
        JSON.stringify({ delta: 'The door ' }),
        JSON.stringify({ delta: 'creaks open.' }),
        JSON.stringify({
          done: true,
          content: '{"content": "The door creaks open."}',
          finishReason: 'STOP',
          promptTokens: 12,
          completionTokens: 8,
        }),
      ]) as unknown as Response
    );

    const client = new ClientGeminiClient();
    const onChunk = jest.fn();

    const result = await client.generateContent('a prompt', { onChunk });

    expect(onChunk.mock.calls).toEqual([['The door '], ['creaks open.']]);
    expect(result).toEqual({
      content: '{"content": "The door creaks open."}',
      finishReason: 'STOP',
      promptTokens: 12,
      completionTokens: 8,
    });
  });

  it('resolves without a subscriber when onChunk is omitted', async () => {
    mockedAiFetch.mockResolvedValue(
      fakeStreamingResponse([
        JSON.stringify({ delta: 'Hello' }),
        JSON.stringify({ done: true, content: 'Hello', finishReason: 'STOP' }),
      ]) as unknown as Response
    );

    const client = new ClientGeminiClient();
    const result = await client.generateContent('a prompt');

    expect(result.content).toBe('Hello');
  });

  it('sends the caller output ceiling when one is given, and the default otherwise', async () => {
    const doneLine = JSON.stringify({ done: true, content: 'Hello', finishReason: 'STOP' });
    mockedAiFetch.mockResolvedValue(fakeStreamingResponse([doneLine]) as unknown as Response);

    const client = new ClientGeminiClient();
    await client.generateContent('a prompt', { maxTokens: 6144 });
    mockedAiFetch.mockResolvedValue(fakeStreamingResponse([doneLine]) as unknown as Response);
    await client.generateContent('a prompt');

    const sentMaxTokens = mockedAiFetch.mock.calls.map(
      ([, init]) => JSON.parse(String(init?.body)).config.maxTokens
    );
    expect(sentMaxTokens).toEqual([6144, 2048]);
  });

  it('rejects with a friendly message when the stream carries an error event', async () => {
    mockedAiFetch.mockResolvedValue(
      fakeStreamingResponse([JSON.stringify({ error: 'connection reset' })]) as unknown as Response
    );

    const client = new ClientGeminiClient();
    await expect(client.generateContent('a prompt')).rejects.toThrow();
  });

  it('rejects when the HTTP response itself is not ok', async () => {
    mockedAiFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ error: 'Rate limit exceeded. Please try again later.' }),
    } as unknown as Response);

    const client = new ClientGeminiClient();
    await expect(client.generateContent('a prompt')).rejects.toThrow(/rate limit/i);
  });
});
