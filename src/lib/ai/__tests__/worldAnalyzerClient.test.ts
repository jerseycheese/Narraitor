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

    expect(fetch).toHaveBeenCalledWith('/api/ai/analyze-world', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: 'A fantasy world' }),
    });

    expect(result).toEqual(mockResponse);
  });

  it('should return default suggestions when API fails', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('API error'));

    const result = await analyzeWorldDescriptionClient('A fantasy world');

    expect(result.attributes).toHaveLength(6);
    expect(result.skills).toHaveLength(12);
    expect(result.attributes[0].name).toBe('Strength');
    expect(result.skills[0].name).toBe('Combat');
  });

  it('should handle HTTP errors gracefully', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    const result = await analyzeWorldDescriptionClient('A fantasy world');

    expect(result.attributes).toHaveLength(6);
    expect(result.skills).toHaveLength(12);
  });
});