// Evaluates a chosen decision option's skill requirements: rolls each skill
// check, builds the narrative tags that get merged into the next segment,
// derives an overall decision outcome. Extracted from
// NarrativeController.generateNextSegment as a pure (no React state) unit;
// the only side effect is the injected onSkillCheckPerformed callback.

import { evaluateSkillCheck } from '@/utils/skillCheckEvaluator';
import { logger } from '@/lib/utils/logger';
import type { Character as UtilCharacter } from '@/types/character.types';
import type { Character as StoreCharacter } from '@/state/characterStore';
import type { World } from '@/types/world.types';
import type {
  DecisionOption,
  DecisionOutcome,
  DecisionWeight,
  SkillCheckRoll,
} from '@/types/narrative.types';

export interface DecisionSkillCheckParams {
  selectedOption: DecisionOption | null;
  character: StoreCharacter | undefined;
  world: World | undefined;
  onSkillCheckPerformed?: (results: SkillCheckRoll[]) => void;
}

export interface DecisionSkillCheckResult {
  skillCheckTags: string[];
  rollResults: SkillCheckRoll[];
  decisionOutcome?: DecisionOutcome;
}

// Adapt the store's character shape to the skill-check evaluator's expected format.
function adaptStoreCharacterToUtil(character: StoreCharacter): UtilCharacter {
  return {
    id: character.id,
    name: character.name,
    description: character.description,
    worldId: character.worldId,
    skills: character.skills.map((skill) => ({
      skillId: skill.worldSkillId || skill.id,
      level: skill.level,
      experience: 0,
      isActive: true,
    })),
    attributes: character.attributes.map((attr) => ({
      attributeId: attr.worldAttributeId || attr.id,
      value: attr.modifiedValue || attr.baseValue,
    })),
    derivedStats: [],
    background: {
      history: character.background?.history || '',
      personality: character.background?.personality || '',
      goals: character.background?.goals || [],
      fears: character.background?.fears || [],
      relationships: [],
    },
    inventory: {
      characterId: character.inventory.characterId,
      items: [],
      capacity: character.inventory.capacity,
      categories: [],
      itemOrder: [],
    },
    status: character.status,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  };
}

export function evaluateDecisionSkillChecks({
  selectedOption,
  character,
  world,
  onSkillCheckPerformed,
}: DecisionSkillCheckParams): DecisionSkillCheckResult {
  const skillCheckTags: string[] = [];
  const rollResults: SkillCheckRoll[] = [];

  if (selectedOption?.requirements && character && world) {
    // Filter for skill requirements only
    const skillRequirements = selectedOption.requirements.filter(
      (req) => req.type === 'skill'
    );

    for (const requirement of skillRequirements) {
      const requiredLevel =
        typeof requirement.value === 'number'
          ? requirement.value
          : parseInt(requirement.value, 10);

      // ChoiceGenerator has already converted skill names to IDs
      // targetId now contains the skill ID directly
      const skillCheck = {
        skillId: requirement.targetId,
        difficulty: requiredLevel,
      };

      const adaptedCharacter = adaptStoreCharacterToUtil(character);

      try {
        const rollResult = evaluateSkillCheck(
          adaptedCharacter,
          skillCheck,
          world.skills || []
        );
        rollResults.push(rollResult);

        // Build tags based on outcome
        if (rollResult.isCriticalSuccess) {
          skillCheckTags.push(`skill-critical-success:${requirement.targetId}`);
        } else if (rollResult.isCriticalFailure) {
          skillCheckTags.push(`skill-critical-failure:${requirement.targetId}`);
        } else if (rollResult.success) {
          skillCheckTags.push(`skill-success:${requirement.targetId}`);
        } else {
          skillCheckTags.push(`skill-failure:${requirement.targetId}`);
        }

        skillCheckTags.push(`skill-roll:${rollResult.diceRoll}`);
      } catch (error) {
        logger.error('Skill check failed:', error);
        skillCheckTags.push(`skill-error:${requirement.targetId}`);
      }
    }
  }

  // Pass results to parent component
  onSkillCheckPerformed?.(rollResults);



  let decisionOutcome: DecisionOutcome | undefined;
  if (rollResults.length > 0) {
    const successCount = rollResults.filter((r) => r.success).length;
    const failureCount = rollResults.length - successCount;
    const hasCriticalSuccess = rollResults.some((r) => r.isCriticalSuccess);
    const hasCriticalFailure = rollResults.some((r) => r.isCriticalFailure);

    if (failureCount === 0) {
      decisionOutcome = hasCriticalSuccess ? 'critical-success' : 'success';
    } else if (successCount === 0) {
      decisionOutcome = hasCriticalFailure ? 'critical-failure' : 'failure';
    } else {
      decisionOutcome = 'mixed';
    }
  }

  return { skillCheckTags, rollResults, decisionOutcome };
}

/**
 * Whether a decision's skill rolls should end the run outright.
 *
 * A CRITICAL-weight decision is fatal only on a true critical-failure roll
 * (natural 1) — a catastrophic outcome that feels earned. An ordinary missed
 * roll on a critical decision is a survivable setback: the narrative reflects
 * the failure, and the AI can still mark the segment fatal in genuinely lethal
 * context. This keeps deadly stakes for the worst rolls without ending the
 * story on a single unlucky-but-ordinary failure (issue #1426).
 */
export function isFatalCriticalDecision(
  decisionWeight: DecisionWeight | undefined,
  rollResults: Pick<SkillCheckRoll, 'isCriticalFailure'>[]
): boolean {
  return (
    decisionWeight === 'critical' &&
    rollResults.some((r) => r.isCriticalFailure)
  );
}
