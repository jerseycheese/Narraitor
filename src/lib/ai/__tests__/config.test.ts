import { DEFAULT_TEXT_MODEL, getDefaultConfig, resolveEffectiveGeminiKey } from '../config';

const ORIGINAL = process.env.GEMINI_API_KEY;

afterEach(() => {
  process.env.GEMINI_API_KEY = ORIGINAL;
});

describe('getDefaultConfig', () => {
  test('runs on the model the caller resolved from the request', () => {
    expect(getDefaultConfig('key', 'gemini-2.5-pro').modelName).toBe('gemini-2.5-pro');
  });

  test('falls back to the default model when none was resolved', () => {
    expect(getDefaultConfig('key').modelName).toBe(DEFAULT_TEXT_MODEL);
  });
});

describe('resolveEffectiveGeminiKey', () => {
  test('uses the server key when the caller resolved nothing', () => {
    process.env.GEMINI_API_KEY = 'env-key';
    expect(resolveEffectiveGeminiKey()).toBe('env-key');
  });

  test('prefers a key the caller resolved', () => {
    process.env.GEMINI_API_KEY = 'env-key';
    expect(resolveEffectiveGeminiKey('byo-key')).toBe('byo-key');
  });

  test('refuses the server key when a request resolved no Gemini key', () => {
    // A player on another provider produces null here on every turn. Falling
    // back would bill the deployment for a turn they are paying for elsewhere.
    process.env.GEMINI_API_KEY = 'env-key';
    expect(resolveEffectiveGeminiKey(null)).toBe('');
  });
});
