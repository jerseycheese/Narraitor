import { DEFAULT_TEXT_MODEL, getDefaultConfig } from '../config';

describe('getDefaultConfig', () => {
  test('runs on the model the caller resolved from the request', () => {
    expect(getDefaultConfig('key', 'gemini-2.5-pro').modelName).toBe('gemini-2.5-pro');
  });

  test('falls back to the default model when none was resolved', () => {
    expect(getDefaultConfig('key').modelName).toBe(DEFAULT_TEXT_MODEL);
  });
});
