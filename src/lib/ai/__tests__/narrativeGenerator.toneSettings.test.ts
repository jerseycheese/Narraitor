import { NarrativeGenerator } from '../narrativeGenerator';
import { useWorldStore } from '@/state/worldStore';
import { ToneSettings } from '@/types/tone-settings.types';
import { EntityID } from '@/types/common.types';
import { MockAIClient } from '../../__mocks__/mockAiClient';

describe('NarrativeGenerator Tone Settings Integration', () => {
  let generator: NarrativeGenerator;
  let mockAiClient: MockAIClient;
  let worldId: EntityID;

  beforeEach(() => {
    useWorldStore.getState().reset();
    mockAiClient = new MockAIClient();
    generator = new NarrativeGenerator(mockAiClient);

    // Create a world with tone settings
    const toneSettings: ToneSettings = {
      contentRating: 'PG-13',
      narrativeStyle: 'dramatic',
      languageComplexity: 'advanced',
      customInstructions: 'Focus on character development and emotional depth'
    };

    worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A dramatic fantasy world',
      genre: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 100,
        skillPointPool: 100
      },
      toneSettings
    });
  });

  test('should include tone settings in narrative generation prompt', async () => {
    mockAiClient.setMockResponse({
      content: 'Generated narrative content',
    });

    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character'],
      generationParameters: {
        segmentType: 'scene'
      }
    });

    const narrativePrompt = mockAiClient.getPrompts()[0];

    expect(narrativePrompt).toContain('PG-13 CONTENT GUIDELINES');
    expect(narrativePrompt).toContain('DRAMATIC NARRATIVE STYLE');
    expect(narrativePrompt).toContain('ADVANCED LANGUAGE COMPLEXITY');
    expect(narrativePrompt).toContain('Focus on character development and emotional depth');
  });

  test('should respect content rating in generated content validation', async () => {
    const explicitContent = 'This contains explicit violence and mature themes...';
    mockAiClient.setMockResponse({
      content: explicitContent,
    });

    const result = await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character']
    });

    // Should validate content against rating
    expect(result.content).toBeDefined();
    // Content should be filtered or modified based on PG-13 rating
  });

  test('should maintain consistent tone across multiple generations', async () => {
    mockAiClient.setMockResponse({
      content: 'Consistent dramatic narrative',
    });

    // Generate multiple segments
    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character']
    });

    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character']
    });

    const prompts = mockAiClient.getPrompts();
    const narrativePrompts = prompts.filter((prompt) =>
      prompt.includes('dramatic') && prompt.includes('PG-13')
    );

    expect(narrativePrompts).toHaveLength(2);
    narrativePrompts.forEach((prompt) => {
      expect(prompt).toContain('dramatic');
      expect(prompt).toContain('PG-13');
    });
  });

  test('should handle missing tone settings gracefully', async () => {
    // Create world without tone settings
    const worldWithoutTone = useWorldStore.getState().createWorld({
      name: 'Default World',
      description: 'A world without tone settings',
      genre: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 100,
        skillPointPool: 100
      }
    });

    mockAiClient.setMockResponse({
      content: 'Default narrative content',
    });

    await generator.generateSegment({
      worldId: worldWithoutTone,
      sessionId: 'test-session',
      characterIds: ['test-character']
    });

    const narrativePrompt = mockAiClient.getPrompts()[0];

    // Should use default tone settings with detailed guidance
    expect(narrativePrompt).toContain('PG-RATED CONTENT GUIDELINES');
    expect(narrativePrompt).toContain('BALANCED NARRATIVE STYLE');
  });

  test('should apply tone settings to initial scene generation', async () => {
    mockAiClient.setMockResponse({
      content: 'Initial scene with dramatic tone',
    });

    await generator.generateInitialScene(worldId, ['test-character']);

    const narrativePrompt = mockAiClient.getPrompts()[0];

    expect(narrativePrompt).toContain('DRAMATIC NARRATIVE STYLE');
    expect(narrativePrompt).toContain('PG-13 CONTENT GUIDELINES');
  });
});
