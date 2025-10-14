import {
  Decision,
  ChoiceAlignment,
  DecisionRequirement,
  RequirementLogic,
} from '@/types/narrative.types';
import { WorldSkill } from '@/types/world.types';
import { InventoryItem } from '@/types/inventory.types';
import { resolveSkillData } from '@/lib/utils/gameDataResolver';
import { evaluateRequirement } from '@/lib/utils/requirementEvaluator';
import { getNormalizedItemRequirementGroups } from '@/lib/utils/requirementNormalizer';
import { SimpleChoice } from './ChoiceSelector';

export interface NormalizedOption {
  id: string;
  text: string;
  hint?: string;
  isSelected?: boolean;
  alignment?: ChoiceAlignment;
  isDisabledByRequirements?: boolean;
  disabledReason?: string;
  skillRequirements?: Array<{
    requirement: DecisionRequirement;
    skillName?: string;
    met: boolean;
  }>;
  itemRequirementGroups?: Array<{
    logic: RequirementLogic;
    met: boolean;
    requirements: Array<{
      requirement: DecisionRequirement;
      itemName: string;
      met: boolean;
      current: number;
      required: number;
    }>;
  }>;
}

interface RequirementEvaluationContext {
  skills: Array<{
    id: string;
    characterId: string;
    worldSkillId?: string;
    name: string;
    level: number;
    category?: string;
  }>;
  inventory: {
    items: InventoryItem[];
  };
}

/**
 * Normalizes decision options into a common format with evaluated requirements
 */
export function normalizeDecisionOptions(
  decision: Decision,
  selectedOptionId: string | null,
  worldSkills: WorldSkill[],
  evaluationContext: RequirementEvaluationContext
): NormalizedOption[] {
  return (decision.options || []).map(opt => {
    // Process skill requirements
    const skillRequirements = opt.requirements?.filter(req => req.type === 'skill').map(req => {
      const skillData = resolveSkillData(req.targetId, worldSkills);
      const evaluation = evaluateRequirement(req, evaluationContext);

      return {
        requirement: req,
        skillName: skillData?.name || 'Unknown Skill',
        met: evaluation.success
      };
    }) || [];

    // Process item requirements (normalized groups)
    const normalizedGroups = getNormalizedItemRequirementGroups(
      opt.requiredItems,
      opt.requirements
    );
    const itemRequirementGroups = normalizedGroups.map(group => {
      const logic: RequirementLogic = group.logic ?? 'all';
      const evaluatedRequirements = group.requirements.map(req => {
      const evaluation = evaluateRequirement(req, evaluationContext);

        return {
          requirement: req,
          itemName: evaluation.itemName || req.targetId,
          met: evaluation.success,
          current: evaluation.current,
          required: typeof evaluation.required === 'number' ? evaluation.required : 0
        };
      });

      const groupMet = logic === 'any'
        ? evaluatedRequirements.some(req => req.met)
        : evaluatedRequirements.every(req => req.met);

      return {
        logic,
        met: groupMet,
        requirements: evaluatedRequirements
      };
    });

    const allSkillRequirementsMet = skillRequirements.every(r => r.met);
    const allItemGroupsMet =
      itemRequirementGroups.length === 0 ||
      itemRequirementGroups.every(group => group.met);

    const disabledReasonParts: string[] = [];
    if (!allSkillRequirementsMet) {
      const missingSkills = skillRequirements
        .filter(req => !req.met)
        .map(req => req.skillName || 'Required skill');
      if (missingSkills.length > 0) {
        disabledReasonParts.push(`Skills: ${missingSkills.join(', ')}`);
      }
    }

    if (!allItemGroupsMet) {
      const missingItems = itemRequirementGroups
        .filter(group => !group.met)
        .flatMap(group =>
          group.requirements.map(req => {
            if (req.met) {
              return null;
            }
            const requiredAmount = req.required > 0 ? `${req.current}/${req.required}` : `${req.current}`;
            return `${req.itemName}${req.required > 0 ? ` (${requiredAmount})` : ''}`;
          }).filter((value): value is string => Boolean(value))
        );
      if (missingItems.length > 0) {
        disabledReasonParts.push(`Items: ${missingItems.join(', ')}`);
      }
    }

    const disabledReason = disabledReasonParts.length > 0
      ? `Requires ${disabledReasonParts.join(' | ')}`
      : undefined;

    return {
      id: opt.id,
      text: opt.text,
      hint: opt.hint,
      isSelected: opt.id === decision.selectedOptionId || opt.id === selectedOptionId,
      alignment: opt.alignment,
      isDisabledByRequirements: !(allSkillRequirementsMet && allItemGroupsMet),
      disabledReason,
      skillRequirements,
      itemRequirementGroups
    };
  });
}

/**
 * Normalizes simple choices into the common format (no requirements)
 */
export function normalizeSimpleChoices(
  choices: SimpleChoice[],
  selectedOptionId: string | null
): NormalizedOption[] {
  return choices.map(choice => ({
    id: choice.id,
    text: choice.text,
    isSelected: choice.isSelected || choice.id === selectedOptionId,
    alignment: 'neutral' as ChoiceAlignment,
    isDisabledByRequirements: false,
    disabledReason: undefined,
    skillRequirements: [],
    itemRequirementGroups: []
  }));
}
