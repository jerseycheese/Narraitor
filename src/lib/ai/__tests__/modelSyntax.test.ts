import { isValidBodyModel, isValidGeminiModel } from '../modelSyntax';

describe('isValidBodyModel', () => {
  it('accepts standard vendor-prefixed and tagged model IDs', () => {
    expect(isValidBodyModel('openai/gpt-4o')).toBe(true);
    expect(isValidBodyModel('meta-llama/Llama-3.3-70B-Instruct-Turbo')).toBe(true);
    expect(isValidBodyModel('google/gemini-2.5-flash:free')).toBe(true);
    expect(isValidBodyModel('claude-sonnet-5')).toBe(true);
    expect(isValidBodyModel('a')).toBe(true);
  });

  it('accepts valid leading-~ body-carried model aliases', () => {
    expect(isValidBodyModel('~deepseek/deepseek-flash-latest')).toBe(true);
    expect(isValidBodyModel('~anthropic/claude-3.5-sonnet')).toBe(true);
    expect(isValidBodyModel('~openai/gpt-4o')).toBe(true);
    expect(isValidBodyModel('~a')).toBe(true);
  });

  it('accepts models up to 128 characters with or without leading ~', () => {
    const maxNoTilde = 'a'.repeat(128);
    expect(isValidBodyModel(maxNoTilde)).toBe(true);

    const maxWithTilde = '~' + 'a'.repeat(127);
    expect(isValidBodyModel(maxWithTilde)).toBe(true);
  });

  it('rejects bare or mispositioned ~ characters', () => {
    expect(isValidBodyModel('~')).toBe(false);
    expect(isValidBodyModel('~~deepseek/chat')).toBe(false);
    expect(isValidBodyModel('~/model')).toBe(false);
    expect(isValidBodyModel('~-model')).toBe(false);
    expect(isValidBodyModel('deepseek/~chat')).toBe(false);
    expect(isValidBodyModel('vendor~model')).toBe(false);
    expect(isValidBodyModel('deepseek/chat~')).toBe(false);
  });

  it('rejects whitespace, newlines, and control characters', () => {
    expect(isValidBodyModel('deepseek /chat')).toBe(false);
    expect(isValidBodyModel(' deepseek/chat')).toBe(false);
    expect(isValidBodyModel('deepseek/chat ')).toBe(false);
    expect(isValidBodyModel('deepseek/\nchat')).toBe(false);
    expect(isValidBodyModel('deepseek/\tchat')).toBe(false);
    expect(isValidBodyModel('deepseek/\0chat')).toBe(false);
  });

  it('rejects strings exceeding 128 characters', () => {
    expect(isValidBodyModel('a'.repeat(129))).toBe(false);
    expect(isValidBodyModel('~' + 'a'.repeat(128))).toBe(false);
  });

  it('rejects empty string or non-string inputs', () => {
    expect(isValidBodyModel('')).toBe(false);
    expect(isValidBodyModel(null)).toBe(false);
    expect(isValidBodyModel(undefined)).toBe(false);
    expect(isValidBodyModel(123)).toBe(false);
  });
});

describe('isValidGeminiModel', () => {
  it('accepts valid URL-safe Google model IDs', () => {
    expect(isValidGeminiModel('gemini-2.5-flash')).toBe(true);
    expect(isValidGeminiModel('gemini-1.5-pro')).toBe(true);
    expect(isValidGeminiModel('gemini_2_0_flash')).toBe(true);
    expect(isValidGeminiModel('a')).toBe(true);
    expect(isValidGeminiModel('a'.repeat(64))).toBe(true);
  });

  it('keeps Gemini URL-carried rules separate and rejects body-carried aliases and paths', () => {
    expect(isValidGeminiModel('~deepseek/deepseek-flash-latest')).toBe(false);
    expect(isValidGeminiModel('google/gemini-2.5-flash')).toBe(false);
    expect(isValidGeminiModel('gemini-2.5-flash:free')).toBe(false);
    expect(isValidGeminiModel('../../models/other')).toBe(false);
  });

  it('rejects Gemini models exceeding 64 characters, whitespace, or invalid types', () => {
    expect(isValidGeminiModel('a'.repeat(65))).toBe(false);
    expect(isValidGeminiModel('gemini flash')).toBe(false);
    expect(isValidGeminiModel('')).toBe(false);
    expect(isValidGeminiModel(null)).toBe(false);
    expect(isValidGeminiModel(undefined)).toBe(false);
  });
});
