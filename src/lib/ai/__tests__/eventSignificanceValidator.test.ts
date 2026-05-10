import { getAIConfig } from '../config';
import { validateEventSignificance } from '../eventSignificanceValidator';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => {
  const GoogleGenAI = jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  }));
  return { GoogleGenAI };
});

describe('validateEventSignificance', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
  });

  it('uses configured model name for validation requests', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        isSignificant: false,
        reason: 'No consequential change.',
      }),
    });

    const result = await validateEventSignificance(
      'Character hesitates near the transit car.'
    );

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: getAIConfig().modelName,
      })
    );
    expect(result).toEqual({
      isSignificant: false,
      reason: 'No consequential change.',
    });
  });
});
