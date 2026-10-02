import { PROVIDER_PRESETS } from '../presets';
import { supportsImages } from '../providers/capabilities';

/**
 * Guards the two things about a preset that can't be caught by reading it.
 *
 * `available` is a claim that somebody ran a real key through
 * scripts/verify-openai-compatible-stream.mjs, and nothing in CI can make that
 * call - so the test's job is to notice when one gets flipped, not to check it.
 */
describe('PROVIDER_PRESETS', () => {
  it('marks available exactly the presets someone has driven a live turn through', () => {
    const available = PROVIDER_PRESETS.filter((preset) => preset.available).map((p) => p.id);
    // OpenRouter, Ollama and OpenAI each joined Gemini after a real streamed
    // turn came back in more than one delta with a parseable envelope - 152
    // deltas on openai/gpt-4o, 104 on gpt-5.6-luna, 78 on a self-hosted mistral.
    // Adding an id here without that run is the thing this test exists to make
    // somebody think twice about.
    expect(available).toEqual(['gemini', 'openrouter', 'ollama', 'openai']);
  });

  it('notes that OpenRouter covers dozens of models with one key', () => {
    const openrouter = PROVIDER_PRESETS.find((preset) => preset.id === 'openrouter');
    expect(openrouter?.note).toBe('one key, dozens of models');
  });

  it('asks OpenAI for max_completion_tokens, which is the only name it accepts', () => {
    const openai = PROVIDER_PRESETS.find((preset) => preset.id === 'openai');
    expect(openai?.maxOutputTokensParam).toBe('max_completion_tokens');
  });

  it('leaves every other preset on max_tokens, which is what they still speak', () => {
    const moved = PROVIDER_PRESETS.filter((preset) => preset.maxOutputTokensParam).map((p) => p.id);
    expect(moved).toEqual(['openai']);
  });

  it('marks OpenAI as fixing its sampling controls, since its models reject ours', () => {
    const fixed = PROVIDER_PRESETS.filter((preset) => preset.hasFixedSamplingControls).map(
      (p) => p.id
    );
    expect(fixed).toEqual(['openai']);
  });

  it('explicitly defines requiresEndpoint and modelDiscovery for every preset', () => {
    for (const preset of PROVIDER_PRESETS) {
      expect(typeof preset.requiresEndpoint).toBe('boolean');
      expect(typeof preset.modelDiscovery).toBe('boolean');
    }
    const requiringEndpoint = PROVIDER_PRESETS.filter((p) => p.requiresEndpoint).map((p) => p.id);
    expect(requiringEndpoint).toEqual(['ollama']);
  });

  it('suggests OpenRouter alias ~deepseek/deepseek-flash-latest', () => {
    const openrouter = PROVIDER_PRESETS.find((p) => p.id === 'openrouter');
    expect(openrouter?.defaultModel).toBe('~deepseek/deepseek-flash-latest');
  });

  it('suggests a model for every preset, so the field is never blank', () => {
    for (const preset of PROVIDER_PRESETS) {
      expect(preset.defaultModel).not.toBe('');
    }
  });

  it('claims image support only where the provider path can actually generate images', () => {
    for (const preset of PROVIDER_PRESETS) {
      expect(preset.capabilities.images).toBe(supportsImages(preset.type));
    }
  });

  it('asks for no key exactly where the player supplies the endpoint themselves', () => {
    const keyless = PROVIDER_PRESETS.filter((preset) => preset.requiresApiKey === false);

    expect(keyless.map((preset) => preset.id)).toEqual(['ollama']);
    for (const preset of keyless) {
      expect(preset.requiresEndpoint).toBe(true);
    }
  });

  it('covers every service the multi-provider work set out to list', () => {
    expect(PROVIDER_PRESETS.map((preset) => preset.id).sort()).toEqual([
      'claude',
      'deepseek',
      'gemini',
      'groq',
      'mistral',
      'ollama',
      'openai',
      'openrouter',
      'perplexity',
      'together',
    ]);
  });

  /**
   * The request layer drops these names before they reach fetch, so a preset
   * naming one is not a vulnerability. It is a preset whose author believed it
   * was setting something it isn't, which is worth failing a build over.
   */
  it('asks for no header that would carry the key or declare the body', () => {
    for (const preset of PROVIDER_PRESETS) {
      const names = Object.keys(preset.customHeaders ?? {}).map((name) => name.toLowerCase());

      expect(names).not.toContain('authorization');
      expect(names).not.toContain('content-type');
    }
  });
});
