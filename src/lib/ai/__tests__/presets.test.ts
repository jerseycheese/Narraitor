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
  it('marks only Gemini as available, because it is the only one verified live', () => {
    const available = PROVIDER_PRESETS.filter((preset) => preset.available).map((p) => p.id);
    expect(available).toEqual(['gemini']);
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
});
