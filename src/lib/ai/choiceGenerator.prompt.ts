import { getNarrativeTemplate } from '../promptTemplates/narrativeTemplateManager';
import { useCharacterStore } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useNPCStore } from '@/state/npcStore';
import { useSessionStore } from '@/state/sessionStore';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import { getLoreContextForPrompt } from './loreContextHelper';
import { buildInventoryContext } from '@/lib/promptContext/inventoryContextBuilder';
import { playerDecisionTracker } from './playerDecisionTracker';
import { formatDecisions } from './simpleDecisionFormatter';
import { type SimpleNarrativeContext } from './simpleDecisionRelevance';
import { formatSkillsForNarrative } from './attributeSkillFormatter';
import { formatPersonalityForChoices } from './choiceGenerator.personality';
import type { NarrativeContext } from '@/types/narrative.types';
import type { World } from '@/types/world.types';
import type { EntityID } from '@/types/common.types';
import { logger } from '@/lib/utils/logger';
interface ChoicePromptInput {
  world: World;
  worldId: string;
  narrativeContext: NarrativeContext;
  characterIds: string[];
  sessionId?: EntityID;
  useAlignedChoices?: boolean;
  includeDecisionHistory?: boolean;
  maxOptions?: number;
}
export const buildChoicePrompt = ({
  world,
  worldId,
  narrativeContext,
  characterIds,
  sessionId,
  useAlignedChoices = false,
  includeDecisionHistory = true,
  maxOptions,
}: ChoicePromptInput): string => {
  const resolvedCharacterIds = resolveCharacterIds(characterIds, worldId);
  const template = getTemplate(
    useAlignedChoices ? 'alignedPlayerChoice' : 'playerChoice'
  );
  const context = buildContext(
    world,
    narrativeContext,
    resolvedCharacterIds,
    maxOptions
  );
  const basePrompt = template(context);
  const inventoryAwarePrompt = enhancePromptWithInventory(
    basePrompt,
    resolvedCharacterIds
  );
  const skillAwarePrompt = enhancePromptWithCharacterSkills(
    inventoryAwarePrompt,
    resolvedCharacterIds
  );
  const personalityAwarePrompt = enhancePromptWithPersonality(
    skillAwarePrompt,
    resolvedCharacterIds,
    useAlignedChoices
  );
  const loreEnhancedPrompt = enhancePromptWithLore(
    personalityAwarePrompt,
    worldId,
    sessionId
  );
  const toneEnhancedPrompt = enhancePromptWithToneSettings(
    loreEnhancedPrompt,
    world
  );
  return includeDecisionHistory && sessionId
    ? enhancePromptWithDecisionHistory(toneEnhancedPrompt, worldId, sessionId)
    : toneEnhancedPrompt;
};
const resolveCharacterIds = (
  characterIds: string[],
  worldId: string
): string[] => {
  if (characterIds && characterIds.length > 0) return characterIds;
  try {
    const sessionCharacterId = useSessionStore.getState().characterId;
    if (sessionCharacterId) return [sessionCharacterId];
    const { characters, currentCharacterId, worldCharacterIds } =
      useCharacterStore.getState();
    if (currentCharacterId) return [currentCharacterId];
    const roster = worldCharacterIds?.[worldId] ?? [];
    if (roster.length > 0) return roster;
    const playerCharacter = Object.values(characters).find(
      (character) => character?.isPlayer
    );
    return playerCharacter ? [playerCharacter.id] : [];
  } catch {
    return [];
  }
};
const getTemplate = (templateType: string) => {
  const templateKey = `narrative/${templateType}`;
  try {
    return getNarrativeTemplate(templateKey);
  } catch (error) {
    logger.error('Template not found:', templateKey, error);
    throw error;
  }
};
const buildContext = (
  world: World,
  narrativeContext: NarrativeContext,
  characterIds: string[],
  maxOptions?: number
) => ({
  worldName: world.name,
  worldDescription: world.description,
  genre: world.genre,
  narrativeContext,
  characterIds,
  optionCount: maxOptions,
  worldSkills:
    world.skills?.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
    })) || [],
  worldNpcs: getWorldNpcs(world.id),
});

const getWorldNpcs = (worldId: string): Array<{ id: string; name: string }> => {
  try {
    return useNPCStore
      .getState()
      .getNPCsByWorld(worldId)
      .map((npc) => ({ id: npc.id, name: npc.name }));
  } catch {
    return [];
  }
};
const enhancePromptWithLore = (
  prompt: string,
  worldId: string,
  sessionId?: EntityID
): string => {
  const loreContext = getLoreContextForPrompt(worldId, sessionId, {
    recordUsage: true,
    source: 'choices',
  });
  return prompt + loreContext;
};
const enhancePromptWithToneSettings = (
  prompt: string,
  world: World
): string => {
  const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
  const detailedInstructions = getDetailedToneInstructions(
    toneSettings.contentRating,
    toneSettings.narrativeStyle,
    toneSettings.languageComplexity,
    toneSettings.customInstructions
  );
  const choiceSpecificGuidance = `

CHOICE GENERATION FOCUS:
- ALL player choice options must strictly follow the content rating guidelines
- Choice descriptions should match the specified narrative style
- Use the specified language complexity in all choice text
- Ensure choices are appropriate and align with the tone settings
- Present options that respect the content boundaries while maintaining agency`;

  return prompt + detailedInstructions + choiceSpecificGuidance;
};
const enhancePromptWithInventory = (
  prompt: string,
  characterIds: string[]
): string => {
  try {
    if (!characterIds || characterIds.length === 0) return prompt;
    const characterId = characterIds[0];
    const { getCharacterItems } = useInventoryStore.getState();
    const items = getCharacterItems(characterId);
    if (!items || items.length === 0) return prompt;
    const equippedItemIds = getEquippedItemIds(characterIds);
    const { context: inventorySection } = buildInventoryContext(items, {
      equippedItemIds,
    });
    if (!inventorySection) return prompt;
    const guidance = `

PLAYER INVENTORY CONTEXT:
${inventorySection}

CHOICE DESIGN RULES:
- The player ALREADY possesses the items listed above.
- Do NOT create options that suggest picking up or rediscovering these items.
- You may reference these items as tools or resources, but focus choices on new actions that move the narrative forward.`;

    return `${prompt}${guidance}`;
  } catch {
    return prompt;
  }
};
const enhancePromptWithCharacterSkills = (
  prompt: string,
  characterIds: string[]
): string => {
  try {
    if (!characterIds || characterIds.length === 0) return prompt;
    const { characters } = useCharacterStore.getState();
    const skillSections: string[] = [];
    for (const characterId of characterIds) {
      const character = characters[characterId];
      if (!character || !character.skills || character.skills.length === 0) continue;
      const skillString = formatSkillsForNarrative(character.skills);
      if (skillString) skillSections.push(`${character.name}: ${skillString}`);
    }
    if (skillSections.length === 0) return prompt;
    const guidance = `

CHARACTER SKILLS CONTEXT:
${skillSections.join('\n')}

SKILL-BASED CHOICE GUIDANCE:
- When relevant to the situation, suggest choices that leverage the character's skills
- High-level skills (Master, Expert) should enable advanced options
- Lower-level skills (Trained, Novice) can still provide options but with appropriate risk
- Don't force skill-based choices if they don't fit the narrative context`;

    return `${prompt}${guidance}`;
  } catch {
    return prompt;
  }
};

const enhancePromptWithPersonality = (
  prompt: string,
  characterIds: string[],
  useAlignedChoices: boolean
): string => {
  try {
    if (!characterIds || characterIds.length === 0) return prompt;
    const { characters } = useCharacterStore.getState();
    let playerCharacter;
    for (const characterId of characterIds) {
      const character = characters[characterId];
      if (character?.isPlayer) {
        playerCharacter = character;
        break;
      }
    }
    if (!playerCharacter && characterIds.length === 1) {
      playerCharacter = characters[characterIds[0]];
    }
    if (!playerCharacter) return prompt;
    const personalitySection = formatPersonalityForChoices(
      playerCharacter,
      !useAlignedChoices
    );
    if (!personalitySection) return prompt;
    return `${prompt}${personalitySection}`;
  } catch {
    return prompt;
  }
};

const enhancePromptWithDecisionHistory = (
  prompt: string,
  worldId: EntityID,
  sessionId: EntityID
): string => {
  try {
    const currentContext: SimpleNarrativeContext = { worldId, sessionId };

    let decisions = playerDecisionTracker.getRelevantDecisions(
      currentContext,
      10,
      { worldId, sessionId }
    );

    if (decisions.length === 0) {
      decisions = playerDecisionTracker.getRelevantDecisions(
        currentContext,
        10,
        { worldId }
      );
    }

    if (decisions.length === 0) {
      return prompt;
    }

    const decisionHistory = formatDecisions(decisions);

    const decisionGuidance = `

## Past Decision History
${decisionHistory}

CHOICE GENERATION INSTRUCTIONS:
- Generate choices that reflect the player's established decision-making patterns
- Create natural callbacks to relevant past decisions when appropriate
- Align options with the character's demonstrated personality
- Acknowledge consequences of previous choices where relevant
- Ensure choices feel consistent with the player's history`;

    return `${prompt}${decisionGuidance}`;
  } catch (error) {
    logger.error('Error enhancing prompt with decision history:', error);
    return prompt;
  }
};

const getEquippedItemIds = (characterIds: string[] | undefined): string[] => {
  if (!characterIds || characterIds.length === 0) {
    return [];
  }

  try {
    const { getCharacterItems } = useInventoryStore.getState();
    return getCharacterItems(characterIds[0])
      .filter((item) => item.equipped)
      .map((item) => item.id);
  } catch {
    return [];
  }
};
