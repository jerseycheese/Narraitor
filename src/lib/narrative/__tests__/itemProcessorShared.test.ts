// src/lib/narrative/__tests__/itemProcessorShared.test.ts

import { itemNamesMatch } from '../itemProcessorShared';
import { checkItemSimilarityClient } from '@/lib/inventory/checkItemSimilarityClient';

jest.mock('@/lib/utils/logger');
jest.mock('@/lib/inventory/checkItemSimilarityClient');

const mockCheckSimilarity = checkItemSimilarityClient as jest.MockedFunction<
  typeof checkItemSimilarityClient
>;

describe('itemNamesMatch dedup heuristics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckSimilarity.mockResolvedValue({
      similar: false,
      confidence: 0,
      rationale: 'AI fallback',
    });
  });

  it('matches singular/plural pairs without an AI call', async () => {
    const result = await itemNamesMatch('Gold Coin', 'Gold Coins');

    expect(result).toBe(true);
    expect(mockCheckSimilarity).not.toHaveBeenCalled();
  });

  it('matches descriptive expansions via substring without an AI call', async () => {
    const result = await itemNamesMatch('Lantern', 'Rusty Kerosene Lantern');

    expect(result).toBe(true);
    expect(mockCheckSimilarity).not.toHaveBeenCalled();
  });

  it('defers genuinely different names to the AI similarity check', async () => {
    const result = await itemNamesMatch('Healing Potion', 'Iron Shield');

    expect(result).toBe(false);
    expect(mockCheckSimilarity).toHaveBeenCalledTimes(1);
  });

  it('does not false-match short unrelated names', async () => {
    await itemNamesMatch('Key', 'Donkey');

    // "Key" is below the substring threshold, so this should defer to AI
    // rather than declaring a match locally.
    expect(mockCheckSimilarity).toHaveBeenCalledTimes(1);
  });
});
