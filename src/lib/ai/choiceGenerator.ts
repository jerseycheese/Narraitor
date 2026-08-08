import { AIClient } from './types';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import { Decision, NarrativeContext, DecisionRequirement } from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { checkAndRecordLoreMentions } from './loreContextHelper';
import { safeTrim } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { buildChoicePrompt } from './choiceGenerator.prompt';
import { parseChoiceResponse, applyAlignmentConsequences, type KnownNpc } from './choiceGenerator.parser';
import { generateFallbackChoices } from './choiceGenerator.fallback';
import { createRequestBudget, recordRequestCalibration } from './narrativeGenerator.budget';

/**
 * Parameters for choice generation
 */
export interface ChoiceGenerationParams {
  worldId: string;
  narrativeContext: NarrativeContext;
  characterIds: string[];
  sessionId?: EntityID;
  maxOptions?: number;
  minOptions?: number;
  useAlignedChoices?: boolean;
  includeDecisionHistory?: boolean;
}

/**
 * Generates meaningful player choices based on the current narrative context,
 * character attributes, and world settings. Falls back to deterministic choices
 * if the AI response is empty, short, or errors.
 */
export async function generateChoices(
  aiClient: AIClient,
  params: ChoiceGenerationParams
): Promise<Decision> {
  try {
    const { worldId, narrativeContext, characterIds, sessionId, maxOptions = 4, minOptions = 3, useAlignedChoices = false, includeDecisionHistory = true } = params;

    const world = getWorld(worldId);
    const budget = createRequestBudget();
    const prompt = buildChoicePrompt({
      world,
      worldId,
      narrativeContext,
      characterIds,
      sessionId,
      useAlignedChoices,
      includeDecisionHistory,
      maxOptions,
      budget,
    });

    // Prefer the explicit choices entry point when the client has one (the
    // browser proxy routes it to /api/narrative/choices); server-side clients
    // hit the SDK directly so generateContent is equivalent there.
    const response = aiClient.generateChoices
      ? await aiClient.generateChoices(prompt)
      : await aiClient.generateContent(prompt);

    recordRequestCalibration(budget, prompt, response);

    if (!response?.content || safeTrim(response?.content ?? '') === '') {
      const fallbackDecision = generateFallbackChoices(world, narrativeContext);
      return applyAlignmentConsequences(ensureSkillChecksForAllOptions(fallbackDecision, world));
    }

    const decision = parseChoiceResponse(response.content, narrativeContext, world, getKnownNpcs(worldId));

    try {
      checkAndRecordLoreMentions(worldId, sessionId, response.content, 'choices');
    } catch (error) {
      // Non-critical: lore mention tracking is dev-only, don't break choice generation
      logger.warn('Failed to record lore mentions:', error);
    }

    // Ensure we have the minimum number of options
    if (decision.options.length < minOptions) {
      const fallbackDecision = generateFallbackChoices(world, narrativeContext);
      const neededOptions = minOptions - decision.options.length;

      // Add additional options from fallback to meet minimum
      for (let i = 0; i < neededOptions; i++) {
        if (i < fallbackDecision.options.length) {
          decision.options.push(fallbackDecision.options[i]);
        }
      }
    }

    // Limit options to maximum if needed
    if (decision.options.length > maxOptions) {
      decision.options = decision.options.slice(0, maxOptions);
    }

    return applyAlignmentConsequences(ensureSkillChecksForAllOptions(decision, world));
  } catch (error) {
    const errorDetails = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      worldId: params.worldId,
      hasNarrativeContext: !!params.narrativeContext,
      characterIds: params.characterIds,
      maxOptions: params.maxOptions,
      minOptions: params.minOptions
    };
    logger.error('❌ CHOICE GENERATOR ERROR:', errorDetails);
    logger.error('Full error object:', error);

    const world = getWorld(params.worldId);
    const fallbackDecision = generateFallbackChoices(world, params.narrativeContext);
    return applyAlignmentConsequences(ensureSkillChecksForAllOptions(fallbackDecision, world));
  }
}

/**
 * NPC roster for the world, used to resolve consequence targets by name.
 * Mirrors getWorld's defensive store read.
 */
const getKnownNpcs = (worldId: string): KnownNpc[] => {
  try {
    return useNPCStore
      .getState()
      .getNPCsByWorld(worldId)
      .map((npc) => ({ id: npc.id, name: npc.name }));
  } catch {
    return [];
  }
};

/**
 * Get world data from the store
 */
const getWorld = (worldId: string): World => {
  const { worlds } = useWorldStore.getState();
  const world = worlds[worldId];

  if (!world) {
    logger.error('World not found:', worldId);
    throw new Error(`World not found: ${worldId}`);
  }

  return world;
};

/**
 * Guarantees every option carries a resolvable skill requirement, inventing one
 * from the option's own text when the model didn't supply it.
 *
 * Exported for scripts/generate-homepage-showcase.mjs, which bundles the real
 * generation chain rather than reimplementing it. Anything that reimplements
 * this drifts: the homepage's first pass hand-rolled the same step and shipped
 * a skill nothing in the option had to do with.
 */
export const ensureSkillChecksForAllOptions = (
  decision: Decision,
  world: World
): Decision => {
  const worldSkills = world.skills ?? [];

  decision.options = decision.options.map((option, index) => {
    const hasSkillRequirement =
      option.requirements?.some((requirement) => requirement.type === 'skill') ??
      false;

    if (hasSkillRequirement) {
      return option;
    }

    const skillRequirement = createFallbackSkillRequirement(
      option.text,
      option.hint,
      worldSkills,
      index
    );

    return {
      ...option,
      requirements: [...(option.requirements ?? []), skillRequirement],
    };
  });

  return decision;
};

const createFallbackSkillRequirement = (
  optionText: string,
  optionHint: string | undefined,
  worldSkills: World['skills'],
  optionIndex: number
): DecisionRequirement => {
  if (worldSkills.length === 0) {
    return {
      type: 'skill',
      targetId: 'generic-skill-check',
      operator: 'gte',
      value: 1,
    };
  }

  const selectedSkill = selectSkillForOption(
    optionText,
    optionHint,
    worldSkills,
    optionIndex
  );
  const requiredLevel = getRequiredSkillLevel(selectedSkill);
  return {
    type: 'skill',
    targetId: selectedSkill.id,
    operator: 'gte',
    value: requiredLevel,
  };
};

const selectSkillForOption = (
  optionText: string,
  optionHint: string | undefined,
  worldSkills: World['skills'],
  optionIndex: number
): World['skills'][number] => {
  const combinedText = `${optionText} ${optionHint ?? ''}`.toLowerCase();
  const skillMention = worldSkills.find((skill) =>
    combinedText.includes(skill.name.toLowerCase())
  );

  if (skillMention) {
    return skillMention;
  }

  return worldSkills[optionIndex % worldSkills.length];
};

const getRequiredSkillLevel = (skill: World['skills'][number]): number => {
  const minValue = Number.isFinite(skill.minValue) ? skill.minValue : 1;
  const maxValue = Number.isFinite(skill.maxValue) ? skill.maxValue : 10;
  const baseValue = Number.isFinite(skill.baseValue) ? skill.baseValue : minValue;

  let level = Math.round(baseValue + 2);
  if (skill.difficulty === 'hard') {
    level += 1;
  } else if (skill.difficulty === 'easy') {
    level -= 1;
  }

  return Math.max(minValue, Math.min(maxValue, level));
};
