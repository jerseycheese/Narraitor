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
    // OpenRouter joined Gemini after a real streamed turn on openai/gpt-4o came
    // back in 152 deltas with a parseable envelope. Adding an id here without
    // that run is the thing this test exists to make somebody think twice about.
    expect(available).toEqual(['gemini', 'openrouter']);
  });

  it('claims image support only where the provider path can actually generate images', () => {
    for (const preset of PROVIDER_PRESETS) {
      expect(preset.capabilities.images).toBe(supportsImages(preset.type));
    }
  });

  it('offers a default model that is one of the models it lists', () => {
    for (const preset of PROVIDER_PRESETS) {
      expect(preset.models).toContain(preset.defaultModel);
    }
  });

  it('covers every service the multi-provider work set out to list', () => {
    expect(PROVIDER_PRESETS.map((preset) => preset.id).sort()).toEqual([
      'deepseek',
      'gemini',
      'groq',
      'mistral',
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
