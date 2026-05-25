import { EntityID } from '@/types/common.types';
import { SkillAttributePrerequisite, WorldAttribute } from '@/types/world.types';

/**
 * A character's current value for a single attribute.
 */
export interface CharacterAttributeValue {
  attributeId: EntityID;
  value: number;
}

/**
 * A prerequisite the character does not yet satisfy, with enough context to
 * explain it to the player.
 */
export interface UnmetPrerequisite {
  attributeId: EntityID;
  attributeName: string;
  requiredValue: number;
  currentValue: number;
}

const lookupCurrentValue = (
  attributeId: EntityID,
  characterAttributes: CharacterAttributeValue[]
): number =>
  characterAttributes.find((attr) => attr.attributeId === attributeId)?.value ?? 0;

/**
 * Returns the prerequisites a character fails to meet. A prerequisite with a
 * non-positive minValue is treated as no requirement.
 */
export const getUnmetPrerequisites = (
  prerequisites: SkillAttributePrerequisite[] | undefined,
  characterAttributes: CharacterAttributeValue[],
  worldAttributes: WorldAttribute[] = []
): UnmetPrerequisite[] => {
  if (!prerequisites || prerequisites.length === 0) {
    return [];
  }

  return prerequisites
    .filter((prereq) => prereq.minValue > 0)
    .filter((prereq) => {
      // Skip prerequisites that reference an attribute the world no longer
      // has — a stale reference (e.g. after the attribute was deleted) should
      // not permanently lock the skill. Only applies when we have the world's
      // attribute list to check against.
      if (worldAttributes.length === 0) return true;
      return worldAttributes.some((attr) => attr.id === prereq.attributeId);
    })
    .map((prereq) => ({
      attributeId: prereq.attributeId,
      attributeName:
        worldAttributes.find((attr) => attr.id === prereq.attributeId)?.name ??
        'Unknown attribute',
      requiredValue: prereq.minValue,
      currentValue: lookupCurrentValue(prereq.attributeId, characterAttributes),
    }))
    .filter((unmet) => unmet.currentValue < unmet.requiredValue);
};

/**
 * True when the character satisfies every prerequisite for a skill.
 */
export const arePrerequisitesMet = (
  prerequisites: SkillAttributePrerequisite[] | undefined,
  characterAttributes: CharacterAttributeValue[]
): boolean => {
  if (!prerequisites || prerequisites.length === 0) {
    return true;
  }

  return prerequisites.every(
    (prereq) =>
      prereq.minValue <= 0 ||
      lookupCurrentValue(prereq.attributeId, characterAttributes) >= prereq.minValue
  );
};

/**
 * Human-readable summary of why a skill is locked, e.g.
 * "Requires Strength 5 (you have 3)".
 */
export const formatUnmetPrerequisites = (unmet: UnmetPrerequisite[]): string => {
  if (unmet.length === 0) {
    return '';
  }

  const parts = unmet.map(
    (u) => `${u.attributeName} ${u.requiredValue} (you have ${u.currentValue})`
  );

  return `Requires ${parts.join(', ')}`;
};
