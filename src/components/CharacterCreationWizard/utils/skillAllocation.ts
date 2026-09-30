import { EntityID } from '@/types/common.types';
import { World } from '@/types/world.types';

import Logger from '@/lib/utils/logger';
const logger = new Logger('SkillAllocation');

export interface WizardSkillData {
  skillId: EntityID;
  name: string;
  description?: string;
  level: number;
  minLevel: number;
  maxLevel: number;
  attributeIds?: EntityID[];
  isSelected: boolean;
}

export type WizardSkillInput = Omit<WizardSkillData, 'minLevel' | 'maxLevel'> & {
  minLevel?: number;
  maxLevel?: number;
};

export interface SkillPointPool {
  total: number;
  spent: number;
  remaining: number;
}

export interface SkillBounds {
  minLevel: number;
  maxLevel: number;
}

/**
 * The slice of a world that skill bounds and selection limits read. A full
 * `World` satisfies it.
 */
export interface SkillRulesWorld {
  skills: Array<Pick<World['skills'][number], 'id' | 'minValue' | 'maxValue'>>;
  settings?: Partial<Pick<World['settings'], 'maxSkills'>>;
}

type SkillBoundsInput = Pick<WizardSkillInput, 'skillId' | 'level' | 'minLevel' | 'maxLevel'>;

const DEFAULT_MIN_LEVEL = 1;

/** Hard ceiling on starting skill selections, whatever the world allows. */
export const MAX_SKILL_SELECTION_LIMIT = 8;

const warnMissingWorldSkill = (skillId: EntityID, message: string) => {
  logger.warn(`[CharacterCreationWizard] ${message}`, { skillId });
};

const resolveWorldSkill = (world: SkillRulesWorld | undefined, skillId: EntityID) => {
  return world?.skills.find((ws) => ws.id === skillId);
};

/**
 * Resolves a skill's min/max level: the skill's own bounds win, then the
 * world skill's, then a default.
 */
export const getSkillBounds = (
  skill: SkillBoundsInput,
  world: SkillRulesWorld | undefined
): SkillBounds => {
  const worldSkill = resolveWorldSkill(world, skill.skillId);

  if (!worldSkill) {
    warnMissingWorldSkill(
      skill.skillId,
      'No matching world skill found while normalizing wizard data.'
    );
  }

  const minLevel =
    skill.minLevel ??
    worldSkill?.minValue ??
    (skill.level > 0 ? Math.min(skill.level, DEFAULT_MIN_LEVEL) : DEFAULT_MIN_LEVEL);

  const maxCandidate =
    skill.maxLevel ??
    worldSkill?.maxValue ??
    (worldSkill?.minValue ?? minLevel);

  const maxLevel = Math.max(minLevel, maxCandidate);

  if (maxLevel === minLevel && !worldSkill) {
    warnMissingWorldSkill(
      skill.skillId,
      'Skill has identical min/max bounds after normalization.'
    );
  }

  return { minLevel, maxLevel };
};

/**
 * Ensures wizard skills always carry min/max bounds and a clamped level.
 */
export const normalizeSkillBounds = (
  skills: WizardSkillInput[],
  world: World | undefined
): WizardSkillData[] => {
  return skills.map((skill) => {
    const { minLevel, maxLevel } = getSkillBounds(skill, world);
    const normalizedLevel = Number.isFinite(skill.level)
      ? Math.min(Math.max(skill.level, minLevel), maxLevel)
      : minLevel;

    return {
      ...skill,
      minLevel,
      maxLevel,
      level: normalizedLevel,
    };
  });
};

/**
 * Calculates the spent and remaining skill points relative to the configured pool.
 */
export const calculateSkillPointPool = (
  skills: Array<SkillBoundsInput & { isSelected: boolean }>,
  world: SkillRulesWorld | undefined,
  totalPoints: number
): SkillPointPool => {
  const selectedSkills = skills.filter((skill) => skill.isSelected);

  const spent = selectedSkills.reduce((sum, skill) => {
    const { minLevel } = getSkillBounds(skill, world);
    return sum + Math.max(0, (skill.level ?? minLevel) - minLevel);
  }, 0);

  return {
    total: totalPoints,
    spent,
    remaining: totalPoints - spent,
  };
};

/**
 * How many skills a character may select: the world's `maxSkills`, capped by
 * MAX_SKILL_SELECTION_LIMIT.
 */
export const getMaxSkillSelections = (world: SkillRulesWorld | undefined): number =>
  Math.min(world?.settings?.maxSkills ?? MAX_SKILL_SELECTION_LIMIT, MAX_SKILL_SELECTION_LIMIT);
