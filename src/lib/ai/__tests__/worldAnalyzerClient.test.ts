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

    // Test actual behavior: client should return proper analysis result
    expect(result).toEqual(mockResponse);
    expect(result.attributes).toBeDefined();
    expect(result.skills).toBeDefined();
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