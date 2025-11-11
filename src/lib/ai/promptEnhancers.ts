/**
 * Prompt Enhancers
 *
 * Modular prompt enhancement functions. Each enhancer adds specific context.
 * Consolidated to reduce boilerplate while maintaining clear separation.
 */

import { NarrativeGenerationContext } from './contextBuilder';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import { PersonalizationEngine } from './personalizationEngine';
import { DecisionFormatter } from './decisionFormatter';
import { buildInventoryContext } from '@/lib/promptContext/inventoryContextBuilder';
import { safeTrim } from '@/lib/utils';
import { CharacterGoal } from '@/types/personalization.types';
import { ToneSettings } from '@/types/tone-settings.types';

const COMPLEXITY_ALERTS: Record<ToneSettings['languageComplexity'], string> = {
  simple: '\n\nSIMPLE LANGUAGE ALERT:\n- Keep every sentence under ~12 words.\n- Use everyday vocabulary (grade-school level).\n- Prefer plain, direct statements over figurative language.\n- Violations will be rewritten automatically, so comply on the first pass.',
  moderate: '\n\nMODERATE LANGUAGE REMINDER:\n- Balance concise narration with occasional descriptive flourishes.\n- Target an average of 12-18 words per sentence.\n- Introduce advanced terms sparingly and clarify them in context.',
  advanced: '\n\nADVANCED LANGUAGE REMINDER:\n- Maintain rich vocabulary and layered imagery without sacrificing clarity.\n- Aim for varied sentence structures with an average under ~25 words.\n- Avoid multi-clause run-ons that become difficult to parse.',
  literary: '',
};

const ITEM_ACQUISITION_INSTRUCTIONS = `

ITEM ACQUISITION INSTRUCTIONS:
Only include entries in metadata.itemsAcquired when the player character ends the scene with a new, portable item in their ongoing possession (something they could realistically carry to the next location). Merely noticing, interacting with, or temporarily using environmental objects or stage dressing does NOT count as acquisition. If the character sets an object back down, leaves it behind, or otherwise does not keep it, do not add it. Likewise, if the narrative merely clarifies or renames an item the character already had, update the prose, not the metadata.

Each acquired item should include:
- name: The item's name (required)
- description: Brief description of the item (optional but recommended)
- quantity: Number of items acquired (default: 1)
- acquisitionMethod: How the item was acquired - one of: "loot", "quest", "purchase", "craft", "reward", "gift", "manual", "unknown"

Important:
- Only include items the character ACTUALLY ACQUIRES AND KEEPS during this segment
- Avoid duplicate entries for the same object
- Be specific with item names and descriptions
- Use an appropriate acquisitionMethod for the narrative context

The items will be automatically added to the character's inventory with proper categorization and journal entries.`;

/**
 * Enhance prompt with tone settings
 */
export function enhanceWithToneSettings(prompt: string, context: NarrativeGenerationContext): string {
  const detailedInstructions = getDetailedToneInstructions(
    context.toneSettings.contentRating,
    context.toneSettings.narrativeStyle,
    context.toneSettings.languageComplexity,
    context.toneSettings.customInstructions
  );
  const complexityAlert = COMPLEXITY_ALERTS[context.toneSettings.languageComplexity] ?? '';
  return prompt + detailedInstructions + complexityAlert;
}

/**
 * Enhance prompt with lore context
 */
export function enhanceWithLore(prompt: string, context: NarrativeGenerationContext): string {
  return prompt + (context.loreContext || '');
}

/**
 * Enhance prompt with goal context
 */
export function enhanceWithGoals(prompt: string, context: NarrativeGenerationContext): string {
  if (!context.sessionId || !context.goalContext || !safeTrim(context.goalContext)) {
    return prompt;
  }
  return `${prompt}\n\nCURRENT NARRATIVE GOALS:\n${context.goalContext}\n\nPlease consider these goals when generating the narrative content.`;
}

/**
 * Enhance prompt with personalization
 */
export function enhanceWithPersonalization(prompt: string, context: NarrativeGenerationContext): string {
  if (!context.playerCharacter) return prompt;

  try {
    const personalizationEngine = new PersonalizationEngine();
    const decisionFormatter = new DecisionFormatter();

    // Convert goals
    const characterGoals = context.goals.map((goal): CharacterGoal => ({
      id: goal.id as string,
      description: (goal.description || goal.title) as string,
      priority: (goal.priority === 'critical' || goal.priority === 'high') ? 'primary' :
                (goal.priority === 'medium') ? 'secondary' : 'minor',
      progress: goal.status === 'completed' ? 100 : goal.status === 'abandoned' ? 0 : 20,
      establishedAt: goal.createdAt as string,
      isActive: goal.status === 'active',
    }));

    // Convert player character
    const char = context.playerCharacter as Record<string, unknown>;
    const playerCharacter = {
      id: String(char.id || ''),
      name: String(char.name || ''),
      background: (char.background as { summary?: string })?.summary || String(char.background || ''),
      attributes: (char.attributes as Record<string, number>) || {},
      skills: (char.skills as Array<{ name: string; level: number; worldSkillId?: string }>) || [],
      createdAt: String(char.createdAt || ''),
      updatedAt: String(char.updatedAt || ''),
    };

    // Create personalized context
    const personalizedContext = personalizationEngine.createPersonalizedContext(
      playerCharacter,
      context.world,
      context.relevantDecisions,
      [],
      characterGoals,
      []
    );

    const enhancementText = personalizationEngine.generateNarrativeEnhancement(personalizedContext);

    // Format decision history
    const fallbackScores = context.relevantDecisions.map(decision => ({
      decisionId: decision.id,
      overallScore: 0.5,
      recencyScore: 0.5,
      contextScore: 0.5,
      impactScore: 0.5,
      tagMatchScore: 0.5,
      characterScore: 0.5,
      calculatedAt: new Date().toISOString()
    }));
    const decisionHistory = decisionFormatter.formatDecisions(context.relevantDecisions, fallbackScores, 1000);

    let enhancedPrompt = prompt;
    if (safeTrim(enhancementText)) {
      enhancedPrompt = `${enhancedPrompt}\n\n${enhancementText}`;
    }
    if (decisionHistory) {
      enhancedPrompt = `${enhancedPrompt}${decisionHistory}`;
    }
    if (context.otherCharacterContext) {
      enhancedPrompt = `${enhancedPrompt}\n\n${context.otherCharacterContext}\nWeave these concurrent storylines naturally when they influence the current scene, but avoid forced references.`;
    }

    return enhancedPrompt;
  } catch {
    return prompt;
  }
}

/**
 * Enhance prompt with inventory context
 */
export function enhanceWithInventory(prompt: string, context: NarrativeGenerationContext): string {
  if (!context.inventoryItems || context.inventoryItems.length === 0) {
    return prompt;
  }

  try {
    const { context: inventorySection } = buildInventoryContext(
      context.inventoryItems,
      { equippedItemIds: context.equippedItemIds }
    );

    if (!inventorySection) return prompt;

    const guidance = 'When generating narrative, naturally reference these items only if they matter to the current situation. Avoid forced mentions or repetitive callbacks.';
    return `${prompt}\n\n${inventorySection}\n\n${guidance}`;
  } catch {
    return prompt;
  }
}

/**
 * Enhance prompt with item acquisition instructions
 */
export function enhanceWithItemAcquisition(prompt: string, _context: NarrativeGenerationContext): string {
  return prompt + ITEM_ACQUISITION_INSTRUCTIONS;
}

/**
 * Compose prompt with ordered enhancers
 */
export async function composePrompt(
  basePrompt: string,
  context: NarrativeGenerationContext,
  enhancers: Array<(prompt: string, context: NarrativeGenerationContext) => string>
): Promise<string> {
  let enhancedPrompt = basePrompt;
  for (const enhancer of enhancers) {
    try {
      enhancedPrompt = enhancer(enhancedPrompt, context);
    } catch {
      // Skip failed enhancers
    }
  }
  return enhancedPrompt;
}

/**
 * Default enhancer chain
 */
export const DEFAULT_ENHANCERS = [
  enhanceWithToneSettings,
  enhanceWithLore,
  enhanceWithGoals,
  enhanceWithPersonalization,
  enhanceWithInventory,
  enhanceWithItemAcquisition,
];

/**
 * Initial scene enhancers (no goals)
 */
export const INITIAL_SCENE_ENHANCERS = [
  enhanceWithToneSettings,
  enhanceWithLore,
  enhanceWithPersonalization,
  enhanceWithInventory,
  enhanceWithItemAcquisition,
];

/**
 * Skill acknowledgment enhancers
 */
export const SKILL_ENHANCERS = [
  enhanceWithToneSettings,
  enhanceWithLore,
  enhanceWithInventory,
  enhanceWithItemAcquisition,
];
