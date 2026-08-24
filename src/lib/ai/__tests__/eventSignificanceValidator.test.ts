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

  it('applies Gemini descriptor overrides to validation requests', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        isSignificant: true,
        reason: 'A consequential discovery.',
      }),
    });

    await validateEventSignificance('Found the missing ledger.', {}, {
      type: 'gemini',
      endpoint: '',
      model: 'gemini-2.5-pro',
      apiKey: 'player-key',
      temperatureOverride: 0.4,
      topPOverride: 0.7,
      maxTokensOverride: 300,
      customSafetyPromptOverride: 'Keep danger off page.',
      customSystemPromptOverride: 'Answer tersely.',
    });

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-pro',
        contents: expect.stringContaining('Safety guidance:\nKeep danger off page.'),
        config: expect.objectContaining({
          temperature: 0.4,
          topP: 0.7,
          maxOutputTokens: 300,
        }),
      })
    );
    expect(mockGenerateContent.mock.calls[0][0].contents).toContain(
      'Additional system instructions:\nAnswer tersely.'
    );
  });
});
