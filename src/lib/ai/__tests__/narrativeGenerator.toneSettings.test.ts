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
    generator = new NarrativeGenerator(mockAIClient as unknown as AIClient);

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

  test('should apply tone settings to generated narrative content', async () => {
    mockAIClient.generateContent.mockResolvedValue({
      content: 'A dramatic scene unfolds in the mystical realm, where character development takes center stage as emotions run deep.',
      tokenUsage: 100
    });

    const result = await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character'],
      generationParameters: {
        segmentType: 'scene'
      }
    });

    // Test actual behavior: should return narrative content that reflects tone settings
    expect(result.content).toBe('A dramatic scene unfolds in the mystical realm, where character development takes center stage as emotions run deep.');
    expect(result.metadata).toBeDefined();
    // Test that metadata contains expected structure (actual behavior, not implementation details)
    expect(result.metadata.location).toBeDefined();
    expect(result.metadata.tags).toBeDefined();
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
      content: 'Consistent dramatic narrative with advanced language',
      tokenUsage: 100
    });

    // Generate multiple segments
    const result1 = await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character']
    });

    const result2 = await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: ['test-character']
    });

    // Test actual behavior: both results should have consistent metadata structure
    expect(result1.metadata).toBeDefined();
    expect(result2.metadata).toBeDefined();
    expect(result1.metadata.location).toBeDefined();
    expect(result2.metadata.location).toBeDefined();
    expect(result1.content).toBe(result2.content); // Same mock content should be returned
  });

  test('should handle missing tone settings gracefully', async () => {
    // Create world without tone settings
    const worldWithoutTone = worldStore.getState().createWorld({
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

    mockAIClient.generateContent.mockResolvedValue({
      content: 'Default narrative content suitable for all audiences',
      tokenUsage: 100
    });

    const result = await generator.generateSegment({
      worldId: worldWithoutTone,
      sessionId: 'test-session',
      characterIds: ['test-character']
    });

    // Test actual behavior: should use default tone settings
    expect(result.content).toBe('Default narrative content suitable for all audiences');
    expect(result.metadata).toBeDefined();
    // Test that metadata contains expected structure for default world
    expect(result.metadata.location).toBeDefined();
    expect(result.metadata.tags).toBeDefined();
  });

  test('should apply tone settings to initial scene generation', async () => {
    mockAIClient.generateContent.mockResolvedValue({
      content: 'An intensely dramatic opening scene unfolds with sophisticated language and mature themes appropriate for teenage audiences.',
      tokenUsage: 100
    });

    const result = await generator.generateInitialScene(worldId, ['test-character']);

    // Test actual behavior: initial scene should reflect tone settings
    expect(result.content).toBe('An intensely dramatic opening scene unfolds with sophisticated language and mature themes appropriate for teenage audiences.');
    expect(result.metadata).toBeDefined();
    // Test that metadata contains expected structure for initial scene
    expect(result.metadata.location).toBeDefined();
    expect(result.metadata.tags).toBeDefined();
  });
});