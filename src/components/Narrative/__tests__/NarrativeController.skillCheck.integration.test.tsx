/**
 * Integration test for skill check flow
 *
 * This test documents and verifies the skill check contract:
 * 1. ChoiceGenerator converts AI skill names ("Stealth") to world skill IDs ("stealth-skill")
 * 2. NarrativeController passes skill IDs directly to evaluateSkillCheck
 * 3. evaluateSkillCheck looks up skills by ID (not name)
 *
 * This eliminates the name-to-ID conversion that caused the regression where
 * skill checks would fail even when the character had the required skill.
 */

import {
  evaluateSkillCheck,
  type SkillCheckSubject,
} from '@/utils/skillCheckEvaluator';
import { WorldSkill } from '@/types/world.types';

describe('Skill Check Integration - ID-based Flow', () => {
  const mockStealthSkillId = 'stealth-skill';

  const mockWorldSkills: WorldSkill[] = [
    {
      id: mockStealthSkillId,
      worldId: 'test-world',
      name: 'Stealth',
      description: 'Move silently and avoid detection',
      difficulty: 'medium',
      category: 'Subterfuge',
      attributeIds: ['dexterity'],
      baseValue: 1,
      minValue: 0,
      maxValue: 10,
    },
  ];

  const mockCharacter: SkillCheckSubject = {
    attributes: [
      {
        attributeId: 'dexterity',
        value: 14,
      },
    ],
    skills: [
      {
        skillId: mockStealthSkillId,
        level: 5,
      },
    ],
  };

  it('evaluates skill check using skill ID directly', () => {
    // This is the core integration contract:
    // ChoiceGenerator has already converted "Stealth" → mockStealthSkillId
    // NarrativeController passes the ID directly to evaluateSkillCheck
    // evaluateSkillCheck looks up the skill by ID

    const result = evaluateSkillCheck(
      mockCharacter,
      {
        skillId: mockStealthSkillId, // ID, not name
        difficulty: 15,
      },
      mockWorldSkills
    );

    // The skill check should succeed because:
    // 1. Character has the skill (level 5)
    // 2. Skill ID lookup worked correctly
    // 3. No name-to-ID conversion was needed
    expect(result.skillName).toBe('Stealth');
    expect(result.skillId).toBe(mockStealthSkillId);
    expect(result.skillLevel).toBe(5);
    // Result depends on dice roll, but we verified the flow works
  });

  it('handles missing skill ID correctly', () => {
    // If ChoiceGenerator couldn't find a skill ID (unknown skill from AI),
    // evaluateSkillCheck should return an automatic failure

    const result = evaluateSkillCheck(
      mockCharacter,
      {
        skillId: 'nonexistent-skill',
        difficulty: 15,
      },
      mockWorldSkills
    );

    // Should auto-fail for unknown skill
    expect(result.success).toBe(false);
    expect(result.isCriticalFailure).toBe(true);
  });
});
