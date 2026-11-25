import type { ThinkingConfig, ThinkingLevel } from '@google/genai';

/**
 * Models that take Gemini 3's thinking level and list a minimal one. Not every
 * 3.x model does, so add an ID only after checking Google's thinking docs.
 */
const MINIMAL_THINKING_MODELS = new Set(['gemini-3.6-flash']);

/**
 * Keeps thinking as low as the model allows. It adds latency and eats into the
 * output budget meant for visible prose. Gemini 3 can't turn it off and
 * deprecates the budget field; other models keep the 2.5-style budget of 0.
 */
export const getThinkingConfig = (model: string): ThinkingConfig =>
  MINIMAL_THINKING_MODELS.has(model)
    ? { thinkingLevel: 'MINIMAL' as ThinkingLevel }
    : { thinkingBudget: 0 };
