/**
 * @jest-environment node
 */

jest.mock('@/lib/ai/inventoryCategorizer', () => ({
  categorizeInventoryItems: jest.fn(),
}));
jest.mock('@/lib/utils/logger', () => {
  return jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }));
});

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { categorizeInventoryItems } from '@/lib/ai/inventoryCategorizer';
import type { InventoryCategorizationResult } from '@/lib/ai/inventoryCategorizer';
import { DEFAULT_TEXT_MODEL } from '@/lib/ai/config';

const mockCategorize = categorizeInventoryItems as jest.MockedFunction<
  typeof categorizeInventoryItems
>;

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/inventory/categorize', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const aiResult = (
  categoryId: InventoryCategorizationResult['categoryId']
): InventoryCategorizationResult => ({
  categoryId,
  confidence: 0.9,
  rationale: `It is ${categoryId}`,
  source: 'ai',
});

describe('POST /api/inventory/categorize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when no item has a usable name', async () => {
    const response = await POST(makeRequest({ items: [{ name: '   ' }, {}] }));

    expect(response.status).toBe(400);
    expect(mockCategorize).not.toHaveBeenCalled();
  });

  it('keeps results aligned to input order when an invalid item precedes valid ones', async () => {
    // The AI only sees the two valid items, returned in order.
    mockCategorize.mockResolvedValue([
      aiResult('equipment'),
      aiResult('valuables'),
    ]);

    const response = await POST(
      makeRequest({
        items: [
          { name: '   ' }, // invalid - must hold its slot, not shift others
          { name: 'Iron Sword', description: 'A blade' },
          { name: 'Gold Coins', description: 'Currency' },
        ],
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // Only valid items are sent to the categorizer, with the request-resolved
    // key (null here: no BYO header and the env key is the MOCK sentinel) and
    // the resolved model, which is the default without a configured provider.
    expect(mockCategorize).toHaveBeenCalledWith(
      [
        { name: 'Iron Sword', description: 'A blade', context: undefined },
        { name: 'Gold Coins', description: 'Currency', context: undefined },
      ],
      null,
      DEFAULT_TEXT_MODEL
    );

    // Response is full-length and positionally aligned to the input.
    expect(data.results).toHaveLength(3);
    expect(data.results[0]).toMatchObject({
      categoryId: 'miscellaneous',
      source: 'fallback',
    });
    expect(data.results[1]).toMatchObject({ categoryId: 'equipment', source: 'ai' });
    expect(data.results[2]).toMatchObject({ categoryId: 'valuables', source: 'ai' });
  });
});
