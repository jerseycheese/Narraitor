/** @jest-environment node */

jest.mock('@/lib/telemetry/reportServerError');
jest.mock('@/lib/ai/providers/endpointGuard', () => ({
  assertPublicProviderEndpoint: jest.fn().mockResolvedValue(undefined),
  isSafeProviderEndpoint: jest.fn().mockReturnValue(true),
}));

import { POST as generate } from '../generate/route';
import { POST as choices } from '../choices/route';
import { buildAIRequest, readNdjsonEvents } from '../../__tests__/routeHarness';
import {
  PROVIDER_ENDPOINT_HEADER,
  PROVIDER_MODEL_HEADER,
  PROVIDER_TYPE_HEADER,
} from '@/lib/ai/providerKeyHeader';
import { clearOpenRouterModelCache } from '@/lib/ai/providers/openai-compatible/openrouterPolicy';

const originalFetch = global.fetch;
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

function openRouterRequest(path: string, prompt: string, model: string, maxTokens: number) {
  return buildAIRequest(path, { prompt, config: { maxTokens } }, {
    headers: {
      [PROVIDER_TYPE_HEADER]: 'openai-compatible',
      [PROVIDER_ENDPOINT_HEADER]: OPENROUTER_ENDPOINT,
      [PROVIDER_MODEL_HEADER]: model,
    },
  });
}

function modelMetadata(model: string, reasoning: object) {
  return new Response(JSON.stringify({ data: [{
    id: model,
    supported_parameters: ['reasoning', 'max_tokens'],
    reasoning,
  }] }), { headers: { 'Content-Type': 'application/json' } });
}

function upstreamBody(fetchMock: jest.Mock): Record<string, unknown> {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
  return JSON.parse(String(call?.[1].body));
}

describe('OpenRouter reasoning budgets through narrative routes', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    clearOpenRouterModelCache();
  });

  it('reserves the 1024-token choice budget for model-written choices', async () => {
    const model = 'z-ai/glm-5.2';
    const content = '{"choices":[{"text":"Cross the bridge"},{"text":"Turn back"}]}';
    const upstream = jest.fn()
      .mockResolvedValueOnce(modelMetadata(model, { mandatory: false, default_enabled: true }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content }, finish_reason: 'stop' }],
      })));
    global.fetch = upstream as typeof fetch;

    const response = await choices(openRouterRequest('/api/narrative/choices', 'Offer choices.', model, 1024));

    expect(response.status).toBe(200);
    expect((await response.json()).content).toBe(content);
    expect(upstreamBody(upstream)).toMatchObject({
      model,
      max_tokens: 1024,
      reasoning: { enabled: false },
    });
  });

  it('streams complete prose with reasoning disabled on the same endpoint', async () => {
    const model = 'deepseek/deepseek-v4-flash';
    const content = '{"content":"The bridge holds as you cross."}';
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason: 'stop' }] })}\n\n`));
        controller.close();
      },
    });
    const upstream = jest.fn()
      .mockResolvedValueOnce(modelMetadata(model, { mandatory: false, default_enabled: true }))
      .mockResolvedValueOnce(new Response(stream));
    global.fetch = upstream as typeof fetch;

    const response = await generate(openRouterRequest('/api/narrative/generate', 'Continue.', model, 2048));
    const events = await readNdjsonEvents(response);

    expect(events.at(-1)).toMatchObject({ done: true, content, finishReason: 'STOP' });
    expect(upstreamBody(upstream)).toMatchObject({
      model,
      max_tokens: 2048,
      reasoning: { enabled: false },
      stream: true,
    });
  });

  it('uses the least supported effort when a model requires reasoning', async () => {
    const model = 'test/mandatory-reasoner';
    const upstream = jest.fn()
      .mockResolvedValueOnce(modelMetadata(model, {
        mandatory: true,
        supported_efforts: ['high', 'low'],
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content: '{"choices":[]}' }, finish_reason: 'stop' }],
      })));
    global.fetch = upstream as typeof fetch;

    const response = await choices(openRouterRequest('/api/narrative/choices', 'Offer choices.', model, 1024));

    expect(response.status).toBe(200);
    expect(upstreamBody(upstream).reasoning).toEqual({ effort: 'low' });
  });

  it('reports an exhausted output budget instead of returning empty choices', async () => {
    const model = 'test/reasoning-exhausted';
    const upstream = jest.fn()
      .mockResolvedValueOnce(modelMetadata(model, { mandatory: false }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content: '' }, finish_reason: 'length' }],
        usage: { completion_tokens: 1024, completion_tokens_details: { reasoning_tokens: 1024 } },
      })));
    global.fetch = upstream as typeof fetch;

    const response = await choices(openRouterRequest('/api/narrative/choices', 'Offer choices.', model, 1024));

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe("That didn't work.");
  });

  it('does not apply OpenRouter reasoning policy or metadata calls to unrelated endpoints', async () => {
    const unrelatedEndpoint = 'https://api.openai.com/v1/chat/completions';
    const model = 'gpt-4o';
    const content = '{"choices":[{"text":"Run"}]}';
    const upstream = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({
        choices: [{ message: { content }, finish_reason: 'stop' }],
      }))
    );
    global.fetch = upstream as typeof fetch;

    const request = buildAIRequest('/api/narrative/choices', { prompt: 'Offer choices.', config: { maxTokens: 1024 } }, {
      headers: {
        [PROVIDER_TYPE_HEADER]: 'openai-compatible',
        [PROVIDER_ENDPOINT_HEADER]: unrelatedEndpoint,
        [PROVIDER_MODEL_HEADER]: model,
      },
    });

    const response = await choices(request);

    expect(response.status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(upstreamBody(upstream)).not.toHaveProperty('reasoning');
  });

  it('omits reasoning parameter for OpenRouter models that do not support reasoning', async () => {
    const model = 'deepseek/deepseek-chat';
    const content = '{"choices":[{"text":"Explore"}]}';
    const upstream = jest.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: [{ id: model, supported_parameters: ['max_tokens', 'temperature'] }],
      }), { headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content }, finish_reason: 'stop' }],
      })));
    global.fetch = upstream as typeof fetch;

    const response = await choices(openRouterRequest('/api/narrative/choices', 'Offer choices.', model, 1024));

    expect(response.status).toBe(200);
    expect(upstreamBody(upstream)).not.toHaveProperty('reasoning');
  });

  it('reports an exhausted output budget in streamed prose when tokens run out with no content', async () => {
    const model = 'test/stream-exhausted';
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ choices: [{ delta: { content: '' }, finish_reason: 'length' }] })}\n\n`
          )
        );
        controller.close();
      },
    });
    const upstream = jest.fn()
      .mockResolvedValueOnce(modelMetadata(model, { mandatory: false }))
      .mockResolvedValueOnce(new Response(stream));
    global.fetch = upstream as typeof fetch;

    const response = await generate(openRouterRequest('/api/narrative/generate', 'Continue.', model, 2048));
    const events = await readNdjsonEvents(response);

    expect(events.at(-1)).toMatchObject({
      error: expect.stringMatching(/token limit/i),
    });
  });
});
