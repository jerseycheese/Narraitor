/**
 * @jest-environment node
 */

import { OpenAICompatibleClient } from '../client';
import type { ProviderDescriptor } from '../../types';

describe('OpenAICompatibleClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  const descriptor: ProviderDescriptor = {
    type: 'openai-compatible',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'z-ai/glm-5.2',
    apiKey: 'test-key',
  };

  it('generates content and applies OpenRouter reasoning policy', async () => {
    const fetchMock = jest.fn()
      // First call: models metadata
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ id: 'z-ai/glm-5.2', supported_parameters: ['reasoning'], reasoning: { mandatory: false } }],
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      )
      // Second call: completions
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'Generated text.' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 20 },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      );
    global.fetch = fetchMock as typeof fetch;

    const client = new OpenAICompatibleClient(descriptor, { maxRetries: 1, timeout: 30000 });
    const result = await client.generateContent('Write a scene.');

    expect(result.content).toBe('Generated text.');
    expect(result.finishReason).toBe('STOP');
    expect(result.promptTokens).toBe(10);
    expect(result.completionTokens).toBe(20);

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    const body = JSON.parse(String(postCall?.[1]?.body));
    expect(body).toMatchObject({
      model: 'z-ai/glm-5.2',
      reasoning: { enabled: false },
    });
  });

  it('aborts when signal is aborted before or during request', async () => {
    const controller = new AbortController();
    controller.abort();

    const client = new OpenAICompatibleClient(descriptor, { maxRetries: 1, timeout: 30000 });
    await expect(client.generateContent('Write a scene.', { signal: controller.signal })).rejects.toThrow(
      'Request aborted'
    );
  });
});
