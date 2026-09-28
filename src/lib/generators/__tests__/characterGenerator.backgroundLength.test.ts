import { generateAICharacter } from '@/lib/generators/characterGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import {
  createMockWorld,
  createMockWorldAttribute,
  createMockWorldSkill,
} from '@/lib/test-utils/testDataFactory';

jest.mock('@/lib/ai/defaultGeminiClient');

describe('characterGenerator background length clamping', () => {
  const mockGenerateContent = jest.fn();

  const world = createMockWorld({
    attributes: [createMockWorldAttribute({ id: 'attr-1', name: 'Strength' })],
    skills: [createMockWorldSkill({ id: 'skill-1', name: 'Athletics' })],
  });

  // Longer than validateBackground's 1000-character max, matching what the
  // wizard rejects once a suggestion is adopted (issue: AI suggestions could
  // fail the wizard's own validation).
  const overLongText = 'A '.repeat(600).trim();

  beforeEach(() => {
    jest.clearAllMocks();
    (createDefaultGeminiClient as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });
    mockGenerateContent.mockResolvedValue({
      content: JSON.stringify({
        name: 'Generated Hero',
        background: {
          description: overLongText,
          personality: overLongText,
          motivation: 'Find the truth.',
          fears: ['failure'],
          physicalDescription: 'Tall, tired eyes.',
        },
        attributes: [{ id: 'attr-1', value: 7 }],
        skills: [{ id: 'skill-1', level: 5 }],
      }),
      finishReason: 'STOP',
    });
  });

  it('clamps an over-long generated description to the wizard validation limit', async () => {
    const character = await generateAICharacter(world, [], undefined, 'original');

    expect(character.background.description.length).toBeLessThanOrEqual(1000);
    expect(character.background.personality.length).toBeLessThanOrEqual(1000);
  });
});
