import { EntityID } from '@/types/common.types';
import { World } from '@/types/world.types';

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

const DEFAULT_MIN_LEVEL = 1;

const warnMissingWorldSkill = (skillId: EntityID, message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[CharacterCreationWizard]${message}`, { skillId });
  }
};

const resolveWorldSkill = (world: World | undefined, skillId: EntityID) => {
  return world?.skills.find((ws) => ws.id === skillId);
};

const buildBounds = (
  skill: WizardSkillInput,
  world: World | undefined
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
    const { minLevel, maxLevel } = buildBounds(skill, world);
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
  skills: WizardSkillInput[],
  world: World | undefined,
  totalPoints: number
): SkillPointPool => {
  const selectedSkills = skills.filter((skill) => skill.isSelected);

  const spent = selectedSkills.reduce((sum, skill) => {
    const { minLevel } = buildBounds(skill, world);
    return sum + Math.max(0, (skill.level ?? minLevel) - minLevel);
  }, 0);

  return {
    total: totalPoints,
    spent,
    remaining: totalPoints - spent,
  };
};

export const getSkillBounds = (
  skill: WizardSkillInput,
  world: World | undefined
): SkillBounds => buildBounds(skill, world);
