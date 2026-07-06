import { normalizeSkillBounds, calculateSkillPointPool } from '../skillAllocation';
import type { WizardSkillData, WizardSkillInput } from '../skillAllocation';
import type { World } from '@/types/world.types';
import { createMockWorld, createMockWorldSkill } from '@/lib/test-utils';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/utils/logger');

const buildWorld = (overrides: Partial<World> = {}): World => createMockWorld({
  id: 'world-1',
  skills: [
    createMockWorldSkill({
      id: 'skill-1',
      worldId: 'world-1',
      name: 'Archery',
      description: 'Hit targets from afar.',
      attributeIds: [],
      difficulty: 'medium',
      category: 'physical',
      baseValue: 1,
      minValue: 1,
      maxValue: 5,
    }),
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 20,
    skillPointPool: 10,
  },
  ...overrides,
});

describe('skillAllocation utilities', () => {
  const baseSkill: WizardSkillData = {
    skillId: 'skill-1',
    name: 'Archery',
    level: 3,
    minLevel: 1,
    maxLevel: 5,
    isSelected: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('normalizeSkillBounds', () => {
    it('clamps skill levels within the provided world bounds', () => {
      const world = buildWorld();
      const skills = normalizeSkillBounds(
        [
          { ...baseSkill, level: 10 },
          { ...baseSkill, skillId: 'skill-1', level: -2 },
        ],
        world
      );

      expect(skills[0].level).toBe(world.skills[0].maxValue);
      expect(skills[1].level).toBe(world.skills[0].minValue);
    });

    it('logs a warning when a world skill cannot be resolved', () => {
      const missingSkill: WizardSkillInput = {
        ...baseSkill,
        skillId: 'missing-skill',
        level: 2,
        minLevel: undefined,
        maxLevel: undefined,
      };

      const skills = normalizeSkillBounds([missingSkill], undefined);

      expect(skills[0].level).toBe(1);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No matching world skill found while normalizing wizard data.'),
        expect.objectContaining({ skillId: 'missing-skill' })
      );
    });
  });

  describe('calculateSkillPointPool', () => {
    it('computes spent points to minimum level', () => {
      const world = buildWorld();
      const result = calculateSkillPointPool(
        [
          { ...baseSkill, level: 3, isSelected: true },
          { ...baseSkill, skillId: 'skill-1', level: 1, isSelected: true },
          { ...baseSkill, skillId: 'skill-1', level: 2, isSelected: false },
        ],
        world,
        10
      );

      expect(result.total).toBe(10);
      expect(result.spent).toBe(2); // (3 - 1) + (1 - 1) + unused skill
      expect(result.remaining).toBe(8);
    });
  });
});
