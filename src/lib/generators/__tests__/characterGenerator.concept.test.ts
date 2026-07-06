import { generateAICharacter } from '@/lib/generators/characterGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import {
  createMockWorld,
  createMockWorldAttribute,
  createMockWorldSkill,
} from '@/lib/test-utils/testDataFactory';

jest.mock('@/lib/ai/defaultGeminiClient');

describe('characterGenerator concept threading', () => {
  const mockGenerateContent = jest.fn();

  const world = createMockWorld({
    attributes: [createMockWorldAttribute({ id: 'attr-1', name: 'Strength' })],
    skills: [createMockWorldSkill({ id: 'skill-1', name: 'Athletics' })],
  });

  const validResponse = {
    content: JSON.stringify({
      name: 'Generated Hero',
      background: {
        description: 'A weathered investigator.',
        personality: 'Sharp and cynical.',
        motivation: 'Find the truth.',
        fears: ['failure'],
        physicalDescription: 'Tall, tired eyes.',
      },
      attributes: [{ id: 'attr-1', value: 7 }],
      skills: [{ id: 'skill-1', level: 5 }],
    }),
    finishReason: 'STOP',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createDefaultGeminiClient as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });
    mockGenerateContent.mockResolvedValue(validResponse);
  });

  it('includes the user concept in the AI prompt', async () => {
    await generateAICharacter(world, [], undefined, 'original', 'a grizzled detective');

    expect(mockGenerateContent).toHaveBeenCalled();
    const prompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(prompt).toContain('a grizzled detective');
  });

  it('omits the concept clause when no concept is given', async () => {
    await generateAICharacter(world, [], undefined, 'original');

    const prompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(prompt).not.toContain('The user describes this character concept');
  });
});
