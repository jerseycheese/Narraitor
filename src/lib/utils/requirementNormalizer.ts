import {
  DecisionRequirement,
  DecisionItemRequirementGroup,
  DecisionItemRequirements,
  RequirementLogic,
} from '@/types/narrative.types';

const DEFAULT_REQUIREMENT_LOGIC: RequirementLogic = 'all';

/**
 * Type guard to check if value is a DecisionItemRequirementGroup
 */
const isDecisionItemRequirementGroup = (
  value: unknown
): value is DecisionItemRequirementGroup => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'requirements' in value &&
      Array.isArray((value as DecisionItemRequirementGroup).requirements)
  );
};

/**
 * Converts a list of requirements to a normalized requirement group
 * Filters only item-type requirements
 */
const ensureItemRequirementGroup = (
  requirements: DecisionRequirement[] | undefined,
  logic?: RequirementLogic
): DecisionItemRequirementGroup | null => {
  const filtered = (requirements || []).filter((req) => req.type === 'item');
  if (filtered.length === 0) {
    return null;
  }

  return {
    logic: logic ?? DEFAULT_REQUIREMENT_LOGIC,
    requirements: filtered,
  };
};

/**
 * Normalizes various item requirement formats into a consistent array of requirement groups
 * Handles:
 * - undefined/null values
 * - Flat arrays of requirements
 * - Arrays of requirement groups
 * - Single requirement groups
 */
export const getNormalizedItemRequirementGroups = (
  requiredItems: DecisionItemRequirements | undefined
): DecisionItemRequirementGroup[] => {
  if (!requiredItems) {
    return [];
  }

  if (Array.isArray(requiredItems)) {
    if (requiredItems.length === 0) {
      return [];
    }

    const first = requiredItems[0] as DecisionRequirement | DecisionItemRequirementGroup;
    if (isDecisionItemRequirementGroup(first)) {
      return (requiredItems as DecisionItemRequirementGroup[])
        .map((group) => ensureItemRequirementGroup(group.requirements, group.logic))
        .filter((group): group is DecisionItemRequirementGroup => Boolean(group));
    }

    const fallbackGroup = ensureItemRequirementGroup(requiredItems as DecisionRequirement[]);
    return fallbackGroup ? [fallbackGroup] : [];
  }

  if (isDecisionItemRequirementGroup(requiredItems)) {
    const group = ensureItemRequirementGroup(
      requiredItems.requirements,
      requiredItems.logic
    );
    return group ? [group] : [];
  }

  // Unknown format, return empty array
  return [];
};
