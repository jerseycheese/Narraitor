import { parseChoiceResponse } from '../choiceGenerator.parser';
import { ChoiceGenerator } from '../choiceGenerator';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';
import { NarrativeContext } from '@/types/narrative.types';
import { AIClient } from '../types';

describe('Issue #1207 - Ground Choice Skill Requirements', () => {
  const narrativeContext: NarrativeContext = {
    worldId: 'world-1',
    currentSceneId: 'scene-1',
    characterIds: ['char-1'],
    previousSegments: [],
    currentTags: [],
    sessionId: 'session-1',
  };

  describe('Parser Validation', () => {
    it('rejects skills not in the active world', () => {
      const world = createMockWorld({
        id: 'world-1',
        skills: [
          {
            id: 'valid-skill',
            worldId: 'world-1',
            name: 'Valid Skill',
            description: 'A skill in this world',
            difficulty: 'easy',
            baseValue: 1,
            minValue: 0,
            maxValue: 10,
          },
        ],
      });

      const content = `Decision: What do you do?
1. [Neutral] Use an invalid skill
Requirements: Invalid Skill 5+`;

      const decision = parseChoiceResponse(content, narrativeContext, world);

      // Current behavior: it returns an empty requirements array for the option
      expect(decision.options[0].requirements).toBeUndefined();
    });

    it('resolves skill by exact ID if it matches the active world', () => {
      const world = createMockWorld({
        id: 'world-1',
        skills: [
          {
            id: 'skill-id-123',
            worldId: 'world-1',
            name: 'Special Skill',
            description: 'A skill with a specific ID',
            difficulty: 'easy',
            baseValue: 1,
            minValue: 0,
            maxValue: 10,
          },
        ],
      });

      // We want the parser to support "Requirements: skill-id-123 5+"
      const content = `Decision: What do you do?
1. [Neutral] Use skill by ID
Requirements: skill-id-123 5+`;

      const decision = parseChoiceResponse(content, narrativeContext, world);

      // Currently this fails because it only looks at names
      expect(decision.options[0].requirements?.[0]?.targetId).toBe('skill-id-123');
    });

    it('rejects skill IDs from other worlds', () => {
        // This is tricky because the parser doesn't know about other worlds
        // but it should only accept IDs that exist in the CURRENT world.
        const world = createMockWorld({
            id: 'world-1',
            skills: [
              {
                id: 'active-world-skill',
                worldId: 'world-1',
                name: 'Active Skill',
                description: 'Skill in active world',
                difficulty: 'easy',
                baseValue: 1,
                minValue: 0,
                maxValue: 10,
              },
            ],
          });
    
          const content = `Decision: What do you do?
    1. [Neutral] Use other world skill ID
    Requirements: other-world-skill-id 5+`;
    
          const decision = parseChoiceResponse(content, narrativeContext, world);
    
          expect(decision.options[0].requirements).toBeUndefined();
    });
  });

  describe('ChoiceGenerator Validation', () => {
    it('replaces invalid AI requirements with deterministic fallback skill', async () => {
        const world = createMockWorld({
            id: 'world-1',
            skills: [
              {
                id: 'skill-1',
                worldId: 'world-1',
                name: 'Skill 1',
                description: 'First skill',
                difficulty: 'easy',
                baseValue: 1,
                minValue: 0,
                maxValue: 10,
              },
              {
                id: 'skill-2',
                worldId: 'world-1',
                name: 'Skill 2',
                description: 'Second skill',
                difficulty: 'easy',
                baseValue: 1,
                minValue: 0,
                maxValue: 10,
              }
            ],
          });

      const mockAI: AIClient = {
        generateContent: jest.fn().mockResolvedValue({
          content: `Decision: What do you do?
1. [Neutral] Invalid Skill Check
Requirements: Imaginary Skill 5+
2. [Neutral] Valid Skill Check
Requirements: Skill 2 3+`,
        }),
      };

      const generator = new ChoiceGenerator(mockAI);
      
      // Manually call the internal methods to avoid store dependency issues in repro test
      // or just use ChoiceGenerator if we can mock the store.
      // Actually, ChoiceGenerator.generateChoices calls getWorld(worldId) which uses useWorldStore.
      
      // Let's mock useWorldStore
      const { useWorldStore } = await import('@/state/worldStore');
      (useWorldStore.getState as jest.Mock).mockReturnValue({
        worlds: { 'world-1': world }
      });

      const decision = await generator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
      });

      // Option 1 had "Imaginary Skill", which should be rejected by parser
      // and replaced by ensureSkillChecksForAllOptions
      expect(decision.options[0].requirements?.[0].targetId).toBe('skill-1'); // deterministic fallback for index 0
      
      // Option 2 had "Skill 2", which is valid
      expect(decision.options[1].requirements?.[0].targetId).toBe('skill-2');
    });
  });
});
