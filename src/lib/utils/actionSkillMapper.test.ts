import { detectSkillActions, createSkillRequirement, SkillActionMapping } from './actionSkillMapper';
import { DecisionRequirement } from '@/types/narrative.types';

describe('actionSkillMapper', () => {
  describe('detectSkillActions', () => {
    it('detects intimidation actions', () => {
      const results = detectSkillActions('I try to intimidate the guard');
      expect(results).toHaveLength(1);
      expect(results[0].skillId).toBe('intimidation');
      expect(results[0].action).toBe('intimidate');
    });

    it('detects stealth actions', () => {
      const results = detectSkillActions('I sneak past the enemy');
      expect(results).toHaveLength(1);
      expect(results[0].skillId).toBe('stealth');
      expect(results[0].action).toBe('sneak');
    });

    it('detects persuasion actions', () => {
      const results = detectSkillActions('I persuade the merchant to lower the price');
      expect(results).toHaveLength(1);
      expect(results[0].skillId).toBe('charisma');
      expect(results[0].action).toBe('persuade');
    });

    it('detects athletics actions', () => {
      const results = detectSkillActions('I climb the wall');
      expect(results).toHaveLength(1);
      expect(results[0].skillId).toBe('athletics');
      expect(results[0].action).toBe('climb');
    });

    it('returns empty array for non-skill actions', () => {
      const results = detectSkillActions('I walk to the door');
      expect(results).toHaveLength(0);
    });

    it('handles case insensitive matching', () => {
      const results = detectSkillActions('I INTIMIDATE the guard');
      expect(results).toHaveLength(1);
      expect(results[0].skillId).toBe('intimidation');
    });

    it('handles multiple skill actions in one text', () => {
      const results = detectSkillActions('I sneak up and then intimidate the guard');
      expect(results).toHaveLength(2);
      // Results may be in any order, so check both are present
      const skillIds = results.map(r => r.skillId);
      expect(skillIds).toContain('stealth');
      expect(skillIds).toContain('intimidation');
    });
  });

  describe('createSkillRequirement', () => {
    it('creates requirement with default difficulty', () => {
      const mapping: SkillActionMapping = {
        skillId: 'intimidation',
        action: 'intimidate',
        defaultDifficulty: 3
      };

      const requirement = createSkillRequirement(mapping);

      expect(requirement).toEqual({
        type: 'skill',
        targetId: 'intimidation',
        operator: 'gte',
        value: 3
      } as DecisionRequirement);
    });

    it('creates requirement with custom difficulty', () => {
      const mapping: SkillActionMapping = {
        skillId: 'stealth',
        action: 'sneak',
        defaultDifficulty: 2
      };

      const requirement = createSkillRequirement(mapping, 5);

      expect(requirement).toEqual({
        type: 'skill',
        targetId: 'stealth',
        operator: 'gte',
        value: 5
      } as DecisionRequirement);
    });
  });
});