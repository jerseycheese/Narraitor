jest.mock('@/lib/ai/aiFetch', () => ({
  aiFetch: jest.fn(),
}));

import { checkItemSimilarityClient } from '../checkItemSimilarityClient';
import { aiFetch } from '@/lib/ai/aiFetch';

const mockAiFetch = aiFetch as jest.MockedFunction<typeof aiFetch>;

describe('checkItemSimilarityClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends { name1, name2 } in the POST request body', async () => {
    mockAiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ similar: true, confidence: 0.95 }),
    } as unknown as Response);

    await checkItemSimilarityClient({
      name1: 'Iron Sword',
      name2: 'Steel Longsword',
    });

    expect(mockAiFetch).toHaveBeenCalledTimes(1);
    const [endpoint, options] = mockAiFetch.mock.calls[0];
    expect(endpoint).toBe('/api/inventory/check-similarity');
    expect(options?.method).toBe('POST');
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(options?.body as string)).toEqual({
      name1: 'Iron Sword',
      name2: 'Steel Longsword',
    });
  });

  it('returns parsed result on 200 response (resolve path)', async () => {
    const mockResult = {
      similar: true,
      confidence: 0.88,
      rationale: 'Both are standard healing potions with identical effects.',
    };

    mockAiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResult,
    } as unknown as Response);

    const result = await checkItemSimilarityClient({
      name1: 'Healing Potion',
      name2: 'Health Potion',
    });

    expect(result).toEqual(mockResult);
  });

  it('throws with server error text on non-ok response (reject path)', async () => {
    mockAiFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid item names provided' }),
    } as unknown as Response);

    await expect(
      checkItemSimilarityClient({
        name1: '',
        name2: 'Sword',
      })
    ).rejects.toThrow('Invalid item names provided');
  });

  it('falls back to default error message when response has no error text', async () => {
    mockAiFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as unknown as Response);

    await expect(
      checkItemSimilarityClient({
        name1: 'Item A',
        name2: 'Item B',
      })
    ).rejects.toThrow('Item similarity check failed');
  });

  it('falls back to default error message when response body is not valid JSON', async () => {
    mockAiFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Unexpected token < in JSON');
      },
    } as unknown as Response);

    await expect(
      checkItemSimilarityClient({
        name1: 'Item A',
        name2: 'Item B',
      })
    ).rejects.toThrow('Item similarity check failed');
  });

  it('propagates rejection when aiFetch fails with network error', async () => {
    mockAiFetch.mockRejectedValue(new Error('Network error'));

    await expect(
      checkItemSimilarityClient({
        name1: 'Item A',
        name2: 'Item B',
      })
    ).rejects.toThrow('Network error');
  });
});
