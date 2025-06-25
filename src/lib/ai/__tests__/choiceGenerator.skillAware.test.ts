/**
 * @fileoverview Tests for skill-aware choice generation
 * 
 * MVP Focus: Tests that choice generator creates appropriate skill-based choices
 * and passes character skill context to the AI for intelligent choice generation.
 */

import { ChoiceGenerator } from '../choiceGenerator';
import { AIClient } from '../types';
import { NarrativeContext } from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { Character } from '@/types/character.types';

// Mock dependencies
const mockAIClient: jest.Mocked<AIClient> = {
  generateContent: jest.fn()
};

const mockWorldWithSkills: World = {
  id: 'skill-world',
  name: 'Adventure Realm',
  description: 'A world of challenges',
  genre: 'fantasy',
  skills: [
    {
      id: 'stealth',
      name: 'Stealth',
      description: 'Move unseen',
      attributeIds: ['dexterity']
    },
    {
      id: 'persuasion',
      name: 'Persuasion', 
      description: 'Convince others',
      attributeIds: ['charisma']
    },
    {
      id: 'lockpicking',
      name: 'Lockpicking',
      description: 'Open locks',
      attributeIds: ['dexterity']
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockCharacter: Character = {
  id: 'char-1',
  worldId: 'skill-world',
  name: 'Rogue',
  background: 'Sneaky thief',
  attributes: [
    { attributeId: 'dexterity', value: 18 },
    { attributeId: 'charisma', value: 10 }
  ],
  skills: [
    { skillId: 'stealth', level: 7, isActive: true },
    { skillId: 'lockpicking', level: 5, isActive: true },
    { skillId: 'persuasion', level: 2, isActive: true }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock stores
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: () => ({
      worlds: {
        'skill-world': mockWorldWithSkills
      }
    })
  }
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: {
    getState: () => ({
      characters: {
        'char-1': mockCharacter
      }
    })
  }
}));

// Mock template manager
jest.mock('../../promptTemplates/narrativeTemplateManager', () => ({
  narrativeTemplateManager: {
    getTemplate: jest.fn().mockImplementation((key: string) => {
      if (key === 'narrative/playerChoice') {
        return jest.fn().mockImplementation((context) => {
          const worldSkills = context.worldSkills || [];
          let skillsInfo = '';
          if (worldSkills.length > 0) {
            skillsInfo = `\nAVAILABLE SKILLS IN THIS WORLD:\n${worldSkills.map((skill: { name: string; description: string }) => `- ${skill.name}: ${skill.description}`).join('\n')}`;
          }
          return `Generate player choices...${skillsInfo}`;
        });
      }
      return jest.fn().mockReturnValue('Template');
    })
  }
}));

describe('ChoiceGenerator - Skill Aware Generation', () => {
  let choiceGenerator: ChoiceGenerator;
  
  beforeEach(() => {
    jest.clearAllMocks();
    choiceGenerator = new ChoiceGenerator(mockAIClient);
  });

  describe('skill-based choice generation', () => {
    it('should generate choices with appropriate skill requirements', async () => {
      // Mock AI response with skill requirements
      const mockAIResponse = {
        content: `Decision Weight: MAJOR
Decision: How will you get past the locked door?
Context Summary: You stand before a heavily locked door blocking your path.

Options:
1. [NEUTRAL] Pick the lock quietly
   Hint: Use your lockpicking skills to open the door
   Requirements: Lockpicking 4+

2. [CHAOTIC] Kick down the door  
   Hint: Make noise but get through quickly

3. [LAWFUL] Look for the key or another entrance
   Hint: Take time to find a legitimate way through

4. [NEUTRAL] Try to convince the guard to let you pass
   Hint: Use charm and persuasion
   Requirements: Persuasion 3+`,
        tokenUsage: 180
      };
      
      mockAIClient.generateContent.mockResolvedValue(mockAIResponse);

      const narrativeContext: NarrativeContext = {
        worldId: 'skill-world',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        sessionId: 'session-1',
        previousSegments: [],
        currentTags: ['obstacle', 'locked-door'],
        currentLocation: 'Mansion Entrance',
        currentSituation: 'Facing a locked door'
      };

      const result = await choiceGenerator.generateChoices({
        worldId: 'skill-world',
        narrativeContext,
        characterIds: ['char-1'],
        maxOptions: 4,
        minOptions: 3
      });

      // Verify choice structure
      expect(result).toBeDefined();
      expect(result.prompt).toBe('How will you get past the locked door?');
      expect(result.options).toHaveLength(4);
      expect(result.decisionWeight).toBe('major');
      expect(result.contextSummary).toContain('locked door');

      // Verify skill requirements were parsed correctly
      const lockpickChoice = result.options.find(opt => opt.text.includes('Pick the lock'));
      const persuasionChoice = result.options.find(opt => opt.text.includes('convince the guard'));
      
      expect(lockpickChoice).toBeDefined();
      expect(lockpickChoice?.requirements).toBeDefined();
      expect(lockpickChoice?.requirements?.[0]).toEqual({
        type: 'skill',
        targetId: 'lockpicking',
        operator: 'gte',
        value: 4
      });

      expect(persuasionChoice).toBeDefined();
      expect(persuasionChoice?.requirements).toBeDefined();
      expect(persuasionChoice?.requirements?.[0]).toEqual({
        type: 'skill',
        targetId: 'persuasion',
        operator: 'gte',
        value: 3
      });
    });

    it('should pass world skills information to AI for context-aware generation', async () => {
      const mockAIResponse = {
        content: `Decision Weight: MINOR
Decision: What will you do?
Context Summary: Exploring the area quietly.

Options:
1. [NEUTRAL] Sneak closer using stealth
   Requirements: Stealth 5+
2. [NEUTRAL] Examine the area carefully  
3. [LAWFUL] Announce your presence`,
        tokenUsage: 120
      };
      
      mockAIClient.generateContent.mockResolvedValue(mockAIResponse);

      const narrativeContext: NarrativeContext = {
        worldId: 'skill-world',
        currentSceneId: 'scene-2',
        characterIds: ['char-1'],
        sessionId: 'session-1',
        previousSegments: [],
        currentTags: ['exploration'],
        currentLocation: 'Dark Alley'
      };

      const result = await choiceGenerator.generateChoices({
        worldId: 'skill-world',
        narrativeContext,
        characterIds: ['char-1']
      });

      // Test actual behavior: should generate choices with skill-aware content and requirements
      expect(result.options).toHaveLength(3);
      expect(result.decisionWeight).toBe('minor');
      expect(result.contextSummary).toBe('Exploring the area quietly.');
      
      const stealthChoice = result.options.find(opt => opt.text.includes('Sneak closer'));
      expect(stealthChoice).toBeDefined();
      expect(stealthChoice?.requirements).toBeDefined();
      expect(stealthChoice?.requirements?.[0]).toEqual({
        type: 'skill',
        targetId: 'stealth',
        operator: 'gte',
        value: 5
      });
    });
  });

  describe('skill requirement parsing', () => {
    it('should correctly parse various skill requirement formats', async () => {
      const mockAIResponse = {
        content: `Decision: Test different skill formats
Context Summary: Testing skill parsing.

Options:
1. [NEUTRAL] Test standard format
   Requirements: Athletics 6+

2. [NEUTRAL] Test without plus
   Requirements: Magic 4

3. [NEUTRAL] Test caps format  
   Requirements: STEALTH 3+

4. [NEUTRAL] No requirements needed`,
        tokenUsage: 100
      };
      
      mockAIClient.generateContent.mockResolvedValue(mockAIResponse);

      const result = await choiceGenerator.generateChoices({
        worldId: 'skill-world',
        narrativeContext: {
          worldId: 'skill-world',
          currentSceneId: 'test',
          characterIds: ['char-1'],
          sessionId: 'test',
          previousSegments: [],
          currentTags: []
        },
        characterIds: ['char-1']
      });

      // Check that different formats were parsed correctly
      const option1 = result.options[0];
      const option2 = result.options[1];
      const option3 = result.options[2];
      const option4 = result.options[3];

      expect(option1.requirements?.[0]).toEqual({
        type: 'skill',
        targetId: 'athletics',
        operator: 'gte',
        value: 6
      });

      expect(option2.requirements?.[0]).toEqual({
        type: 'skill',
        targetId: 'magic',
        operator: 'gte',
        value: 4
      });

      expect(option3.requirements?.[0]).toEqual({
        type: 'skill',
        targetId: 'stealth',
        operator: 'gte',
        value: 3
      });

      expect(option4.requirements).toBeUndefined();
    });
  });

  describe('fallback behavior for skill generation', () => {
    it('should include skill-based fallback choices for fantasy worlds', async () => {
      // Simulate AI failure
      mockAIClient.generateContent.mockRejectedValue(new Error('AI failure'));

      const narrativeContext: NarrativeContext = {
        worldId: 'skill-world',
        currentSceneId: 'fallback-test',
        characterIds: ['char-1'],
        sessionId: 'test',
        previousSegments: [],
        currentTags: [],
        currentLocation: 'Forest Path'
      };

      const result = await choiceGenerator.generateChoices({
        worldId: 'skill-world',
        narrativeContext,
        characterIds: ['char-1']
      });

      // Should return fallback choices with skill requirements
      expect(result).toBeDefined();
      expect(result.options.length).toBeGreaterThan(0);
      
      // Check for skill-based fallback options
      const skillBasedChoice = result.options.find(opt => opt.requirements && opt.requirements.length > 0);
      expect(skillBasedChoice).toBeDefined();
    });

    it('should handle minimum options requirement with skill awareness', async () => {
      // Mock AI response with only 2 options
      const mockAIResponse = {
        content: `Decision: Limited choices
Context Summary: Few options available.

Options:
1. [NEUTRAL] Move forward
   Requirements: Stealth 4+ 
2. [LAWFUL] Turn back`,
        tokenUsage: 80
      };
      
      mockAIClient.generateContent.mockResolvedValue(mockAIResponse);

      const result = await choiceGenerator.generateChoices({
        worldId: 'skill-world',
        narrativeContext: {
          worldId: 'skill-world',
          currentSceneId: 'limited',
          characterIds: ['char-1'],
          sessionId: 'test',
          previousSegments: [],
          currentTags: []
        },
        characterIds: ['char-1'],
        minOptions: 3
      });

      // Should add fallback options to meet minimum
      expect(result.options.length).toBeGreaterThanOrEqual(3);
      
      // First two should be from AI response
      expect(result.options[0].text).toBe('Move forward');
      expect(result.options[1].text).toBe('Turn back');
      
      // Additional options should be fallbacks
      expect(result.options[2]).toBeDefined();
    });
  });

  describe('MVP requirements validation', () => {
    it('should generate choices that vary skill requirements appropriately', async () => {
      const mockAIResponse = {
        content: `Decision: Show skill variety
Context Summary: Multiple skill paths available.

Options:
1. [NEUTRAL] Use stealth approach
   Requirements: Stealth 5+
2. [LAWFUL] Try diplomatic solution  
   Requirements: Persuasion 4+
3. [CHAOTIC] Force your way through
4. [NEUTRAL] Look for alternative route
   Requirements: Lockpicking 3+`,
        tokenUsage: 150
      };
      
      mockAIClient.generateContent.mockResolvedValue(mockAIResponse);

      const result = await choiceGenerator.generateChoices({
        worldId: 'skill-world',
        narrativeContext: {
          worldId: 'skill-world',
          currentSceneId: 'variety-test',
          characterIds: ['char-1'],
          sessionId: 'test',
          previousSegments: [],
          currentTags: []
        },
        characterIds: ['char-1']
      });

      // Should have mixed skill requirements and non-skill choices
      const skillChoices = result.options.filter(opt => opt.requirements && opt.requirements.length > 0);
      const nonSkillChoices = result.options.filter(opt => !opt.requirements || opt.requirements.length === 0);
      
      expect(skillChoices.length).toBeGreaterThan(0);
      expect(nonSkillChoices.length).toBeGreaterThan(0);
      expect(skillChoices.length + nonSkillChoices.length).toBe(result.options.length);

      // Check that different skills are used
      const usedSkills = skillChoices.flatMap(choice => 
        choice.requirements?.map(req => req.targetId) || []
      );
      const uniqueSkills = [...new Set(usedSkills)];
      expect(uniqueSkills.length).toBeGreaterThan(1);
    });
  });
});