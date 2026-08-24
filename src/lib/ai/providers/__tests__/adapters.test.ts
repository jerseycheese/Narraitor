import { geminiAdapter } from '../gemini/adapter';
import { openAICompatibleAdapter } from '../openai-compatible/adapter';
import type { ProviderDescriptor, TextGenerationSpec } from '../types';

const GEMINI: ProviderDescriptor = {
  type: 'gemini',
  endpoint: '',
  model: 'gemini-2.5-flash',
  apiKey: 'player-key',
};

const OPENAI: ProviderDescriptor = {
  type: 'openai-compatible',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'openai/gpt-4o',
  apiKey: 'player-key',
};

const SPEC: TextGenerationSpec = {
  prompt: 'Continue the story.',
  temperature: 0.7,
  maxTokens: 2048,
  contentRating: 'r',
  stream: false,
};

describe('geminiAdapter', () => {
  it('builds the same URLs the pre-split code hardcoded', () => {
    expect(geminiAdapter.buildUrl(GEMINI, SPEC)).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    );
    expect(geminiAdapter.buildUrl(GEMINI, { ...SPEC, stream: true })).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse'
    );
  });

  it('ignores a descriptor endpoint, so no header can steer a Gemini call', () => {
    const spoofed = { ...GEMINI, endpoint: 'https://attacker.test/collect' };

    expect(geminiAdapter.buildUrl(spoofed, SPEC)).toContain('generativelanguage.googleapis.com');
  });

  it('sends the key as a header, never in the URL', () => {
    expect(geminiAdapter.buildHeaders(GEMINI)['x-goog-api-key']).toBe('player-key');
    expect(geminiAdapter.buildUrl(GEMINI, SPEC)).not.toContain('player-key');
  });

  it('builds the native body with the rating-derived safety settings', () => {
    const body = geminiAdapter.buildBody(GEMINI, SPEC) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: { maxOutputTokens: number; thinkingConfig: { thinkingBudget: number } };
      safetySettings: Array<{ category: string; threshold: string }>;
    };

    expect(body.contents[0].parts[0].text).toBe('Continue the story.');
    expect(body.generationConfig.maxOutputTokens).toBe(2048);
    expect(body.generationConfig.thinkingConfig.thinkingBudget).toBe(0);
    // R-rated: explicit content unblocked, the rest at BLOCK_ONLY_HIGH.
    expect(body.safetySettings[0]).toEqual({
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_NONE',
    });
  });

  it('reads content, finish reason and usage out of a native response', () => {
    const parsed = geminiAdapter.parseTextResponse({
      candidates: [{ content: { parts: [{ text: 'A door opens.' }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
    });

    expect(parsed).toEqual({
      ok: true,
      result: { content: 'A door opens.', finishReason: 'STOP', promptTokens: 10, completionTokens: 5 },
    });
  });

  it('reports a response with no parts as malformed, exactly as before the split', () => {
    expect(geminiAdapter.parseTextResponse({ candidates: [{ content: {} }] })).toEqual({
      ok: false,
      failure: 'malformed',
    });
  });

  it("uses the player's advanced-settings overrides in place of the spec defaults", () => {
    const body = geminiAdapter.buildBody(
      { ...GEMINI, temperatureOverride: 1.5, topPOverride: 0.8, maxTokensOverride: 512 },
      SPEC
    ) as { generationConfig: { temperature: number; topP: number; maxOutputTokens: number } };

    expect(body.generationConfig.temperature).toBe(1.5);
    expect(body.generationConfig.topP).toBe(0.8);
    expect(body.generationConfig.maxOutputTokens).toBe(512);
  });
});

describe('openAICompatibleAdapter', () => {
  it('posts to the configured endpoint verbatim, streaming or not', () => {
    expect(openAICompatibleAdapter.buildUrl(OPENAI, SPEC)).toBe(OPENAI.endpoint);
    expect(openAICompatibleAdapter.buildUrl(OPENAI, { ...SPEC, stream: true })).toBe(OPENAI.endpoint);
  });

  it('authenticates with a bearer token', () => {
    expect(openAICompatibleAdapter.buildHeaders(OPENAI).Authorization).toBe('Bearer player-key');
  });

  it('carries the content rating as system guidance, since there is no safety setting to send', () => {
    const body = openAICompatibleAdapter.buildBody(OPENAI, SPEC) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
      max_tokens: number;
      stream?: boolean;
    };

    expect(body.model).toBe('openai/gpt-4o');
    expect(body.max_tokens).toBe(2048);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toContain('adult audience');
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Continue the story.' });
    expect(body).not.toHaveProperty('safetySettings');
    expect(body.stream).toBeUndefined();
  });

  it('renames the output cap when the descriptor says the service moved off max_tokens', () => {
    // OpenAI 400s on max_tokens rather than ignoring it, so this is the
    // difference between a working provider and one that never generates.
    const body = openAICompatibleAdapter.buildBody(
      { ...OPENAI, maxOutputTokensParam: 'max_completion_tokens' },
      SPEC
    ) as Record<string, unknown>;

    expect(body.max_completion_tokens).toBe(2048);
    expect(body).not.toHaveProperty('max_tokens');
  });

  it('omits the sampling controls entirely for a service that fixes them', () => {
    // Sending temperature: 1 is not the workaround - a reasoning model rejects
    // the field being present at all, so both have to be absent.
    const body = openAICompatibleAdapter.buildBody(
      { ...OPENAI, hasFixedSamplingControls: true },
      SPEC
    ) as Record<string, unknown>;

    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('top_p');
    expect(body.messages).toBeDefined();
  });

  it("uses the player's advanced-settings overrides in place of the spec defaults", () => {
    const body = openAICompatibleAdapter.buildBody(
      { ...OPENAI, temperatureOverride: 1.5, topPOverride: 0.8, maxTokensOverride: 512 },
      SPEC
    ) as Record<string, unknown>;

    expect(body.temperature).toBe(1.5);
    expect(body.top_p).toBe(0.8);
    expect(body.max_tokens).toBe(512);
  });

  it('still omits sampling overrides for a service that fixes them, even when one is configured', () => {
    const body = openAICompatibleAdapter.buildBody(
      { ...OPENAI, hasFixedSamplingControls: true, temperatureOverride: 1.5, topPOverride: 0.8 },
      SPEC
    ) as Record<string, unknown>;

    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('top_p');
  });

  it('folds the guidance into the user turn for a model with no system role', () => {
    const gemma = { ...OPENAI, model: 'google/gemma-3-27b-it' };
    const body = openAICompatibleAdapter.buildBody(gemma, SPEC) as {
      messages: Array<{ role: string; content: string }>;
    };

    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe('user');
    expect(body.messages[0].content).toContain('Continue the story.');
  });

  it('asks for usage on the stream, which is otherwise absent entirely', () => {
    const body = openAICompatibleAdapter.buildBody(OPENAI, { ...SPEC, stream: true }) as {
      stream: boolean;
      stream_options: { include_usage: boolean };
    };

    expect(body.stream).toBe(true);
    expect(body.stream_options).toEqual({ include_usage: true });
  });

  it('normalizes the finish-reason vocabulary onto the shared set', () => {
    const parsed = openAICompatibleAdapter.parseTextResponse({
      choices: [{ message: { content: 'A door opens.' }, finish_reason: 'length' }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    expect(parsed).toEqual({
      ok: true,
      result: {
        content: 'A door opens.',
        finishReason: 'MAX_TOKENS',
        promptTokens: 10,
        completionTokens: 5,
      },
    });
  });

  it.each(['content_filter', 'error'])(
    'names an empty 200 with finish_reason "%s" as a content block, not a blank turn',
    (finishReason) => {
      const parsed = openAICompatibleAdapter.parseTextResponse({
        choices: [{ message: { content: '' }, finish_reason: finishReason }],
      });

      expect(parsed).toEqual({ ok: false, failure: 'moderation' });
    }
  );

  it('reads a streaming delta out of the OpenAI frame shape', () => {
    expect(
      openAICompatibleAdapter.parseStreamFrame({
        choices: [{ delta: { content: 'Once upon' } }],
        usage: { prompt_tokens: 30, completion_tokens: 12 },
      })
    ).toEqual({
      text: 'Once upon',
      finishReason: undefined,
      promptTokens: 30,
      completionTokens: 12,
    });
  });
});
