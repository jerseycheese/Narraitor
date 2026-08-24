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
import { matchSkillToOption } from './choiceGenerator.skillMatch';
import { recordRequestCalibration } from './narrativeGenerator.calibration';
import { buildPromptDebugInfo, isDebugInfoEnabled, type DebugInfoContext } from './debugInfoBuilder';
import { getActiveProviderModel } from '@/state/providerStore';
import { DEFAULT_TEXT_MODEL } from './config';

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
    const { worldId, narrativeContext, characterIds, sessionId, maxOptions = 3, minOptions = 3, useAlignedChoices = false, includeDecisionHistory = true } = params;

    const world = getWorld(worldId);
    const prompt = buildChoicePrompt({
      world,
      worldId,
      narrativeContext,
      characterIds,
      sessionId,
      useAlignedChoices,
      includeDecisionHistory,
      maxOptions,
    });

    // Prefer the explicit choices entry point when the client has one (the
    // browser proxy routes it to /api/narrative/choices); server-side clients
    // hit the SDK directly so generateContent is equivalent there.
    const response = aiClient.generateChoices
      ? await aiClient.generateChoices(prompt)
      : await aiClient.generateContent(prompt);

    recordRequestCalibration(prompt, response);

    if (!response?.content || safeTrim(response?.content ?? '') === '') {
      const fallbackDecision = generateFallbackChoices(world, narrativeContext);
      return applyAlignmentConsequences(attachSkillChecksWhereRelevant(fallbackDecision, world));
    }

    const decision = parseChoiceResponse(response.content, narrativeContext, world, getKnownNpcs(worldId));

    // Nothing captured this call's prompt or response before #1829 round 6,
    // which made prompt-level instructions particular to choice generation
    // (the Alignment Mix line among them) unverifiable after the fact.
    if (isDebugInfoEnabled()) {
      const debugInfoContext: DebugInfoContext = {
        fullPrompt: prompt,
        templateName: useAlignedChoices ? 'Aligned Choice Template' : 'Player Choice Template',
        world,
        characterIds,
        modelUsed: getActiveProviderModel() ?? DEFAULT_TEXT_MODEL,
        rawResponse: response.content,
      };
      decision.debugInfo = buildPromptDebugInfo(debugInfoContext);
    }

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

    return applyAlignmentConsequences(attachSkillChecksWhereRelevant(decision, world));
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
    return applyAlignmentConsequences(attachSkillChecksWhereRelevant(fallbackDecision, world));
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
 * Attaches a skill check to the options whose own words point at one of the
 * world's skills, and leaves the rest unchecked.
 *
 * Two deliberate rules:
 * - An option only gets a check when its text or hint matches a skill's name or
 *   description. Options that match nothing carry no check. Naming a skill the
 *   action never implied, and then telling the player that skill is why they
 *   failed, is worse than rolling nothing.
 * - Skill requirements that arrive on an option are kept only when they resolve
 *   to a skill this world has. An unresolvable target is an automatic critical
 *   failure in evaluateSkillCheck, which reads to the player as a rigged loss.
 *
 * Exported for scripts/generate-homepage-showcase.mjs, which bundles the real
 * generation chain rather than reimplementing it. Anything that reimplements
 * this drifts: the homepage's first pass hand-rolled the same step and shipped
 * a skill nothing in the option had to do with.
 */
export const attachSkillChecksWhereRelevant = (
  decision: Decision,
  world: World
): Decision => {
  const worldSkills = world.skills ?? [];

  decision.options = decision.options.map((option) => {
    const resolvable = option.requirements?.filter(
      (requirement) =>
        requirement.type !== 'skill' ||
        worldSkills.some((skill) => skill.id === requirement.targetId)
    );

    if (resolvable?.some((requirement) => requirement.type === 'skill')) {
      return { ...option, requirements: resolvable };
    }

    const matchedSkill = matchSkillToOption(option.text, option.hint, worldSkills);

    if (!matchedSkill) {
      return resolvable ? { ...option, requirements: resolvable } : option;
    }

    return {
      ...option,
      requirements: [
        ...(resolvable ?? []),
        buildSkillRequirement(matchedSkill),
      ],
    };
  });

  return decision;
};

const buildSkillRequirement = (
  skill: World['skills'][number]
): DecisionRequirement => ({
  type: 'skill',
  targetId: skill.id,
  operator: 'gte',
  value: getRequiredSkillLevel(skill),
});

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
