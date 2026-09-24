import { analyzeWorldDescriptionClient } from '../worldAnalyzerClient';

// Mock fetch for testing
global.fetch = jest.fn();

describe('worldAnalyzerClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call the API endpoint and return analysis result', async () => {
    const mockResponse = {
      attributes: [
        { name: 'Strength', description: 'Physical power', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: false }
      ],
      skills: [
        { name: 'Combat', description: 'Fighting ability', difficulty: 'medium', category: 'Combat', linkedAttributeName: 'Strength', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 }
      ]
    };

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await analyzeWorldDescriptionClient('A fantasy world');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
    expect(url).toBe('/api/ai/analyze-world');
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: 'A fantasy world' }),
    });
    // aiFetch's signal comes from timeoutSignal(), which needs AbortSignal.timeout -
    // present in Node/CI's jsdom but not every local jsdom build (see its JSDoc in
    // src/lib/ai/abortTimeout.ts), so don't pin the assertion to one or the other.
    expect(init?.signal === undefined || init?.signal instanceof AbortSignal).toBe(true);

    expect(result).toEqual(mockResponse);
  });

  it('should throw error when API fails', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('API error'));

    await expect(analyzeWorldDescriptionClient('A fantasy world')).rejects.toThrow('API error');
  });

  it('should throw error on HTTP errors', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    await expect(analyzeWorldDescriptionClient('A fantasy world')).rejects.toThrow('Server error');
  });
});