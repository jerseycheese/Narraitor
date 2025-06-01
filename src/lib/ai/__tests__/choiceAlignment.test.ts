import { ChoiceGenerator } from '../choiceGenerator';
import { MockGeminiClient } from '../__mocks__/geminiClient.mock';
import { worldStore } from '@/state/worldStore';
import { NarrativeContext } from '@/types/narrative.types';
import { World } from '@/types/world.types';

// Mock the store
jest.mock('@/state/worldStore');

describe('ChoiceGenerator - Alignment System', () => {
  let choiceGenerator: ChoiceGenerator;
  let mockWorld: World;
  let mockNarrativeContext: NarrativeContext;
  let mockGeminiClient: MockGeminiClient;

  beforeEach(() => {
    mockGeminiClient = new MockGeminiClient();
    choiceGenerator = new ChoiceGenerator(mockGeminiClient);
    mockWorld = {
      id: 'test-world',
      name: 'Test World',
      description: 'A test world for alignment testing',
      theme: 'fantasy',
      customAttributes: [],
      customSkills: [],
      imageUrl: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockNarrativeContext = {
      worldId: 'test-world',
      currentSceneId: 'scene-1',
      characterIds: ['char-1'],
      previousSegments: [],
      currentTags: [],
      sessionId: 'session-1',
      currentLocation: 'Forest Path',
      currentSituation: 'Encounter with bandits'
    };

    // Mock the store to return our test world
    (worldStore.getState as jest.Mock).mockReturnValue({
      worlds: { 'test-world': mockWorld }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Aligned Choice Generation', () => {
    it('should parse aligned choices with lawful/chaos/neutral tags', async () => {
      const mockResponse = `Decision: What will you do?

Options:
1. [LAWFUL] Report the incident to authorities
2. [NEUTRAL] Assess the situation carefully
3. [NEUTRAL] Look for an alternative approach
4. [CHAOS] Create a distraction and act unpredictably`;

      mockGeminiClient.generateContent.mockResolvedValueOnce({
        content: mockResponse
      });

      const result = await choiceGenerator.generateChoices({
        worldId: 'test-world',
        narrativeContext: mockNarrativeContext,
        characterIds: ['char-1'],
        useAlignedChoices: true
      });

      expect(result.options).toHaveLength(4);
      expect(result.options[0].alignment).toBe('lawful');
      expect(result.options[1].alignment).toBe('neutral');
      expect(result.options[2].alignment).toBe('neutral');
      expect(result.options[3].alignment).toBe('chaotic');
    });

    it('should handle CHAOTIC tag variant', async () => {
      const mockResponse = `Decision: What will you do?

Options:
1. [LAWFUL] Follow proper procedures
2. [NEUTRAL] Consider options
3. [CHAOTIC] Act unpredictably`;

      mockGeminiClient.generateContent.mockResolvedValueOnce({
        content: mockResponse
      });

      const result = await choiceGenerator.generateChoices({
        worldId: 'test-world',
        narrativeContext: mockNarrativeContext,
        characterIds: ['char-1'],
        useAlignedChoices: true
      });

      expect(result.options[2].alignment).toBe('chaotic');
    });

    it('should fallback to neutral alignment when tag is missing', async () => {
      const mockResponse = `Decision: What will you do?

Options:
1. Report the incident
2. [NEUTRAL] Look around
3. [CHAOTIC] Act wildly`;

      mockGeminiClient.generateContent.mockResolvedValueOnce({
        content: mockResponse
      });

      const result = await choiceGenerator.generateChoices({
        worldId: 'test-world',
        narrativeContext: mockNarrativeContext,
        characterIds: ['char-1'],
        useAlignedChoices: true
      });

      expect(result.options[0].alignment).toBe('neutral'); // No tag = neutral fallback
      expect(result.options[1].alignment).toBe('neutral');
      expect(result.options[2].alignment).toBe('chaotic');
    });

    it('should use aligned template when useAlignedChoices is true', async () => {
      const mockResponse = `Decision: What will you do?

Options:
1. [LAWFUL] Follow rules
2. [NEUTRAL] Be practical`;

      mockGeminiClient.generateContent.mockResolvedValueOnce({
        content: mockResponse
      });

      await choiceGenerator.generateChoices({
        worldId: 'test-world',
        narrativeContext: mockNarrativeContext,
        characterIds: ['char-1'],
        useAlignedChoices: true
      });

      // Check that aligned template was requested
      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('ALIGNMENT DEFINITIONS')
      );
      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('[LAWFUL]')
      );
    });

    it('should use regular template when useAlignedChoices is false', async () => {
      const mockResponse = `Decision: What will you do?

Options:
1. Look around
2. Move forward`;

      mockGeminiClient.generateContent.mockResolvedValueOnce({
        content: mockResponse
      });

      const result = await choiceGenerator.generateChoices({
        worldId: 'test-world',
        narrativeContext: mockNarrativeContext,
        characterIds: ['char-1'],
        useAlignedChoices: false
      });

      // Should not contain alignment definitions
      expect(mockGeminiClient.generateContent).not.toHaveBeenCalledWith(
        expect.stringContaining('ALIGNMENT DEFINITIONS')
      );
      
      // Should assign neutral alignment to parsed options
      expect(result.options[0].alignment).toBe('neutral');
      expect(result.options[1].alignment).toBe('neutral');
    });
  });

  describe('Fallback Choice Alignment', () => {
    it('should assign appropriate alignments to fallback choices', async () => {
      // Force an error to trigger fallback
      mockGeminiClient.generateContent.mockRejectedValueOnce(new Error('AI Error'));

      const result = await choiceGenerator.generateChoices({
        worldId: 'test-world',
        narrativeContext: mockNarrativeContext,
        characterIds: ['char-1'],
        useAlignedChoices: true
      });

      // Check that fallback choices have alignments
      const alignments = result.options.map(opt => opt.alignment);
      expect(alignments).toEqual(expect.arrayContaining(['neutral', 'lawful']));
    });

    it('should create default options with neutral alignment', async () => {
      const mockResponse = 'Invalid response format';

      mockGeminiClient.generateContent.mockResolvedValueOnce({
        content: mockResponse
      });

      const result = await choiceGenerator.generateChoices({
        worldId: 'test-world',
        narrativeContext: mockNarrativeContext,
        characterIds: ['char-1'],
        useAlignedChoices: true
      });

      // Should fallback to default options
      expect(result.options).toHaveLength(3);
      expect(result.options.every(opt => opt.alignment === 'neutral')).toBe(true);
    });
  });

  describe('Template Selection', () => {
    it('should default to aligned choices when useAlignedChoices is not specified', async () => {
      const mockResponse = `Decision: What will you do?

Options:
1. [LAWFUL] Follow protocol
2. [NEUTRAL] Consider options`;

      mockGeminiClient.generateContent.mockResolvedValueOnce({
        content: mockResponse
      });

      await choiceGenerator.generateChoices({
        worldId: 'test-world',
        narrativeContext: mockNarrativeContext,
        characterIds: ['char-1']
        // useAlignedChoices not specified, should default to true
      });

      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('ALIGNMENT DEFINITIONS')
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed alignment tags gracefully', async () => {
      const mockResponse = `Decision: What will you do?

Options:
1. [UNKNOWN] Do something weird
2. [lawful] Follow rules (lowercase)
3. [CHAOS] Act chaotically
4. [] Empty tag`;

      mockGeminiClient.generateContent.mockResolvedValueOnce({
        content: mockResponse
      });

      const result = await choiceGenerator.generateChoices({
        worldId: 'test-world',
        narrativeContext: mockNarrativeContext,
        characterIds: ['char-1'],
        useAlignedChoices: true
      });

      expect(result.options[0].alignment).toBe('neutral'); // Unknown tag = neutral
      expect(result.options[1].alignment).toBe('lawful'); // Lowercase should work
      expect(result.options[2].alignment).toBe('chaotic');
      expect(result.options[3].alignment).toBe('neutral'); // Empty tag = neutral
    });

    it('should handle missing alignment tags in numbered list', async () => {
      const mockResponse = `Decision: What will you do?

Options:
1. First option without tag
2. [LAWFUL] Second option with tag
3. Third option without tag`;

      mockGeminiClient.generateContent.mockResolvedValueOnce({
        content: mockResponse
      });

      const result = await choiceGenerator.generateChoices({
        worldId: 'test-world',
        narrativeContext: mockNarrativeContext,
        characterIds: ['char-1'],
        useAlignedChoices: true
      });

      expect(result.options[0].alignment).toBe('neutral');
      expect(result.options[1].alignment).toBe('lawful');
      expect(result.options[2].alignment).toBe('neutral');
    });
  });
});