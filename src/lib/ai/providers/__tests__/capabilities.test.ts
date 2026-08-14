import { hasNativeSafetySettings, hasSystemRole, supportsImages } from '../capabilities';

describe('hasSystemRole', () => {
  it('is true for a model that takes a system turn', () => {
    expect(hasSystemRole('openai/gpt-4o')).toBe(true);
  });

  /**
   * These reject a system message outright rather than ignoring it, so the
   * adapter has to fold the guidance into the user turn instead.
   */
  it.each(['google/gemma-2-9b-it', 'gemma2:9b', 'anthropic/claude-3.5-sonnet'])(
    'is false for %s',
    (model) => {
      expect(hasSystemRole(model)).toBe(false);
    }
  );
});

describe('provider facts', () => {
  it('reports a native safety setting for Gemini only', () => {
    expect(hasNativeSafetySettings('gemini')).toBe(true);
    expect(hasNativeSafetySettings('openai-compatible')).toBe(false);
  });

  it('keeps image generation on Gemini', () => {
    expect(supportsImages('gemini')).toBe(true);
    expect(supportsImages('openai-compatible')).toBe(false);
  });
});
