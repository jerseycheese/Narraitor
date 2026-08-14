// src/lib/ai/__tests__/inventoryCategorizer.batch.test.ts
//
// Covers batched categorization (issue #992 opt #4): multiple hint-less items
// are categorized in a single AI call, with per-item keyword fallback when the
// batch response is missing, malformed, or partial.

import { categorizeInventoryItems } from '../inventoryCategorizer';

const mockGenerateContent = jest.fn();

jest.mock('@/lib/utils/logger');
jest.mock('@/lib/ai/geminiClient', () => ({
  GeminiClient: jest.fn().mockImplementation(() => ({
    generateContent: mockGenerateContent,
  })),
}));
jest.mock('@/lib/ai/config', () => ({
  getAIConfig: () => ({
    geminiApiKey: 'test-key',
    modelName: 'test-model',
    maxRetries: 1,
    timeout: 1000,
  }),
  getGenerationConfig: () => ({}),
  getSafetySettings: () => [],
  resolveEffectiveGeminiKey: (requestKey?: string | null) =>
    requestKey === undefined ? 'test-key' : requestKey ?? '',
}));

describe('categorizeInventoryItems (batch)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty array without calling the AI for no items', async () => {
    const results = await categorizeInventoryItems([]);

    expect(results).toEqual([]);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('categorizes multiple items in a single AI call, mapped by index', async () => {
    mockGenerateContent.mockResolvedValue({
      content: JSON.stringify([
        { index: 0, category: 'equipment', confidence: 0.9, rationale: 'A blade' },
        { index: 1, category: 'valuables', confidence: 0.95, rationale: 'Currency' },
      ]),
    });

    const results = await categorizeInventoryItems([
      { name: 'Ancient Sword', description: 'A blade from ages past' },
      { name: 'Gold Coins', description: 'Shiny currency' },
    ]);

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ categoryId: 'equipment', source: 'ai' });
    expect(results[1]).toMatchObject({ categoryId: 'valuables', source: 'ai' });
  });

  it('falls back per-item when the batch response is malformed', async () => {
    mockGenerateContent.mockResolvedValue({ content: 'not json at all' });

    const results = await categorizeInventoryItems([
      { name: 'Iron Sword', description: 'A weapon' },
      { name: 'Health Potion', description: 'A consumable' },
    ]);

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.source === 'fallback')).toBe(true);
    // Keyword fallback still infers sensible categories.
    expect(results[0].categoryId).toBe('equipment');
    expect(results[1].categoryId).toBe('consumables');
  });

  it('falls back for items missing from a partial batch response', async () => {
    mockGenerateContent.mockResolvedValue({
      content: JSON.stringify([
        { index: 0, category: 'equipment', confidence: 0.9 },
      ]),
    });

    const results = await categorizeInventoryItems([
      { name: 'Steel Shield', description: 'Defensive gear' },
      { name: 'Gold Ring', description: 'A precious band' },
    ]);

    expect(results[0]).toMatchObject({ categoryId: 'equipment', source: 'ai' });
    expect(results[1].source).toBe('fallback');
  });

  it('delegates a single item to the per-item categorizer', async () => {
    mockGenerateContent.mockResolvedValue({
      content: JSON.stringify({ category: 'consumables', confidence: 0.8 }),
    });

    const results = await categorizeInventoryItems([
      { name: 'Healing Potion', description: 'Restores health' },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ categoryId: 'consumables', source: 'ai' });
  });
});
