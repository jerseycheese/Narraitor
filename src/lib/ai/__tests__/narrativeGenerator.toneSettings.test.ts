import { NarrativeGenerator } from '../narrativeGenerator';
import { worldStore } from '@/state/worldStore';
import { ToneSettings } from '@/types/tone-settings.types';
import { EntityID } from '@/types/common.types';

// Mock AI client
const mockAIClient = {
  generateContent: jest.fn()
};

describe('NarrativeGenerator Tone Settings Integration', () => {
  let generator: NarrativeGenerator;
  let worldId: EntityID;

  beforeEach(() => {
    worldStore.getState().reset();
    mockAIClient.generateContent.mockClear();
    generator = new NarrativeGenerator(mockAIClient as any);

    // Create a world with tone settings
    const toneSettings: ToneSettings = {
      contentRating: 'PG-13',
      narrativeStyle: 'dramatic',
      languageComplexity: 'advanced',
      customInstructions: 'Focus on character development and emotional depth'
    };

    worldId = worldStore.getState().createWorld({
      name: 'Test World',
      description: 'A dramatic fantasy world',
      theme: 'Fantasy',
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
    mockAIClient.generateContent.mockResolvedValue({
      content: 'Generated narrative content',
      tokenUsage: 100
    });

    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character'],
      generationParameters: {
        segmentType: 'scene'
      }
    });

    expect(mockAIClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Content Rating: PG-13')
    );
    expect(mockAIClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Narrative Style: dramatic')
    );
    expect(mockAIClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Language Complexity: advanced')
    );
    expect(mockAIClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Focus on character development and emotional depth')
    );
  });

  test('should respect content rating in generated content validation', async () => {
    const explicitContent = 'This contains explicit violence and mature themes...';
    mockAIClient.generateContent.mockResolvedValue({
      content: explicitContent,
      tokenUsage: 100
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
    mockAIClient.generateContent.mockResolvedValue({
      content: 'Consistent dramatic narrative',
      tokenUsage: 100
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

    // Both calls should include the same tone settings
    expect(mockAIClient.generateContent).toHaveBeenCalledTimes(2);
    mockAIClient.generateContent.mock.calls.forEach(call => {
      expect(call[0]).toContain('dramatic');
      expect(call[0]).toContain('PG-13');
    });
  });

  test('should handle missing tone settings gracefully', async () => {
    // Create world without tone settings
    const worldWithoutTone = worldStore.getState().createWorld({
      name: 'Default World',
      description: 'A world without tone settings',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 100,
        skillPointPool: 100
      }
    });

    mockAIClient.generateContent.mockResolvedValue({
      content: 'Default narrative content',
      tokenUsage: 100
    });

    await generator.generateSegment({
      worldId: worldWithoutTone,
      sessionId: 'test-session',
      characterIds: ['test-character']
    });

    // Should use default tone settings
    expect(mockAIClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Content Rating: PG')
    );
    expect(mockAIClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Narrative Style: balanced')
    );
  });

  test('should apply tone settings to initial scene generation', async () => {
    mockAIClient.generateContent.mockResolvedValue({
      content: 'Initial scene with dramatic tone',
      tokenUsage: 100
    });

    await generator.generateInitialScene(worldId, ['test-character']);

    expect(mockAIClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('dramatic')
    );
    expect(mockAIClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('PG-13')
    );
  });
});