import { getNarrativeTemplate } from '../promptTemplates/narrativeTemplateManager';
import { useCharacterStore } from '@/state/characterStore';
import type { Character as StoreCharacter } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useNPCStore } from '@/state/npcStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import { getLoreContextForPrompt } from './loreContextHelper';
import { useLoreStore } from '@/state/loreStore';
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
import { canonicalizeName } from '@/lib/utils/textNormalization';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { buildContinuityContractFromStores } from './narrativeGenerator.continuity';
import type { SettledCommitmentDTO } from '../promptTemplates/templates/narrative/context';
import type { SessionSnapshot } from '@/types/turnResolver.types';

interface ChoicePromptInput {
  world: World;
  worldId: string;
  narrativeContext: NarrativeContext;
  characterIds: string[];
  sessionId?: EntityID;
  useAlignedChoices?: boolean;
  includeDecisionHistory?: boolean;
  maxOptions?: number;
  snapshot?: SessionSnapshot;
}
const getSettledCommitments = (
  worldId: string,
  sessionId?: EntityID,
  characterIds?: string[],
  narrativeContext?: NarrativeContext,
  snapshot?: SessionSnapshot
): SettledCommitmentDTO[] | undefined => {
  const targetSessionId = snapshot?.sessionId ?? sessionId;
  if (!isFeatureEnabled('SETTLED_COMMITMENT_CHOICES') || !targetSessionId) return undefined;
  try {
    const contract = buildContinuityContractFromStores(
      {
        worldId: snapshot?.worldId ?? worldId,
        sessionId: targetSessionId,
        characterIds: characterIds ?? (snapshot?.characterId ? [snapshot.characterId] : []),
        narrativeContext,
      },
      undefined,
      snapshot
    );
    if (!contract) return undefined;
    const delivered = contract.commitments.filter((c) => c.status === 'delivered');
    if (delivered.length === 0) return undefined;
    return delivered.slice(0, 6).map((c) => ({ topic: c.topic, by: c.by }));
  } catch {
    return undefined;
  }
};

export const buildChoicePrompt = ({
  world,
  worldId,
  narrativeContext,
  characterIds,
  sessionId,
  useAlignedChoices = false,
  includeDecisionHistory = true,
  maxOptions,
  snapshot,
}: ChoicePromptInput): string => {
  const resolvedCharacterIds = resolveCharacterIds(characterIds, worldId, snapshot);
  const template = getTemplate(
    useAlignedChoices ? 'alignedPlayerChoice' : 'playerChoice'
  );
  const targetSessionId = snapshot?.sessionId ?? sessionId;
  const targetWorldId = snapshot?.worldId ?? worldId;
  const settledCommitments = useAlignedChoices
    ? getSettledCommitments(
        targetWorldId,
        targetSessionId,
        resolvedCharacterIds,
        narrativeContext,
        snapshot
      )
    : undefined;
  const context = buildContext(
    world,
    narrativeContext,
    resolvedCharacterIds,
    maxOptions,
    getTurnIndex(targetSessionId, snapshot),
    settledCommitments,
    snapshot
  );
  const basePrompt = template(context);
  const inventoryAwarePrompt = enhancePromptWithInventory(
    basePrompt,
    resolvedCharacterIds,
    snapshot
  );
  const skillAwarePrompt = enhancePromptWithCharacterSkills(
    inventoryAwarePrompt,
    resolvedCharacterIds,
    snapshot
  );
  const personalityAwarePrompt = enhancePromptWithPersonality(
    skillAwarePrompt,
    resolvedCharacterIds,
    useAlignedChoices,
    snapshot
  );
  const loreEnhancedPrompt = enhancePromptWithLore(
    personalityAwarePrompt,
    targetWorldId,
    targetSessionId,
    snapshot
  );
  const toneEnhancedPrompt = enhancePromptWithToneSettings(
    loreEnhancedPrompt,
    world
  );
  return includeDecisionHistory && targetSessionId
    ? enhancePromptWithDecisionHistory(
        toneEnhancedPrompt,
        targetWorldId,
        targetSessionId,
        snapshot
      )
    : toneEnhancedPrompt;
};
const resolveCharacterIds = (
  characterIds: string[],
  worldId: string,
  snapshot?: SessionSnapshot
): string[] => {
  if (characterIds && characterIds.length > 0) return characterIds;
  if (snapshot?.characterId) return [snapshot.characterId];
  if (snapshot?.character?.id) return [snapshot.character.id];
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
  maxOptions?: number,
  turnIndex?: number,
  settledCommitments?: SettledCommitmentDTO[],
  snapshot?: SessionSnapshot
) => {
  const playerCharacter = getPlayerCharacter(characterIds, snapshot);

  return {
    worldName: world.name,
    worldDescription: world.description,
    genre: world.genre,
    narrativeContext,
    characterIds,
    optionCount: maxOptions,
    turnIndex,
    playerCharacterName: playerCharacter?.name,
    worldSkills:
      world.skills?.map((skill) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
      })) || [],
    worldNpcs: getWorldNpcs(world.id, playerCharacter, snapshot),
    settledCommitments,
  };
};

/**
 * Decisions already made this session - uncapped, unlike
 * NarrativeContext.previousSegments, which every production caller populates
 * from a 5-segment slice (see usePlayerChoices.ts). A codex review on round 6
 * caught that the glossary rotation had keyed off previousSegments.length and
 * would freeze on one order past turn 5.
 */
const getTurnIndex = (sessionId?: EntityID, snapshot?: SessionSnapshot): number => {
  if (snapshot?.decisions) {
    return snapshot.decisions.length;
  }
  if (!sessionId) return 0;
  try {
    return useNarrativeStore.getState().getSessionDecisions(sessionId).length;
  } catch {
    return 0;
  }
};

const getPlayerCharacter = (
  characterIds: string[],
  snapshot?: SessionSnapshot
): StoreCharacter | undefined => {
  if (
    snapshot?.character &&
    snapshot.character.id &&
    (!characterIds.length ||
      characterIds.includes(snapshot.character.id) ||
      snapshot.character.isPlayer ||
      characterIds[0] === snapshot.characterId)
  ) {
    return snapshot.character as StoreCharacter;
  }
  try {
    if (!characterIds || characterIds.length === 0) return undefined;
    const { characters } = useCharacterStore.getState();
    for (const characterId of characterIds) {
      const character = characters[characterId];
      if (character?.isPlayer) return character;
    }
    return characterIds.length === 1 ? characters[characterIds[0]] : undefined;
  } catch {
    return undefined;
  }
};

/**
 * The world's NPCs minus the player.
 *
 * Nothing stops the player landing in the NPC store: every entry the narrative
 * model puts in metadata.characters is synced there, and a model that writes
 * the protagonist into that list mints them an NPC. Left in, they arrive here
 * under a heading that tells the model to use these exact names, and it duly
 * writes options that negotiate with the player.
 */
const getWorldNpcs = (
  worldId: string,
  playerCharacter?: StoreCharacter,
  snapshot?: SessionSnapshot
): Array<{ id: string; name: string }> => {
  try {
    const playerId = playerCharacter?.id;
    const reservedName = playerCharacter?.name
      ? canonicalizeName(playerCharacter.name)
      : '';

    const npcs = snapshot?.npcs ?? useNPCStore.getState().getNPCsByWorld(worldId);

    return npcs
      .filter((npc) => {
        const isPlayer =
          (!!playerId && npc.id === playerId) ||
          (!!reservedName && canonicalizeName(npc.name) === reservedName);
        if (isPlayer) {
          logger.debug('Dropped an NPC entry claiming the player identity', {
            npcId: npc.id,
            name: npc.name,
          });
        }
        return !isPlayer;
      })
      .map((npc) => ({ id: npc.id, name: npc.name }));
  } catch {
    return [];
  }
};
const enhancePromptWithLore = (
  prompt: string,
  worldId: string,
  sessionId?: EntityID,
  snapshot?: SessionSnapshot
): string => {
  if (snapshot?.loreContext !== undefined) {
    if (snapshot.loreContext && process.env.NODE_ENV !== 'production') {
      try {
        const { getLoreContext, recordLoreUsage } = useLoreStore.getState();
        const context = getLoreContext(worldId, sessionId);
        if (context.factIds && context.factIds.length > 0) {
          recordLoreUsage({
            worldId,
            sessionId,
            factIds: context.factIds,
            source: 'choices',
          });
        }
      } catch {
        // Dev/test telemetry only, safe to ignore errors
      }
    }
    return prompt + snapshot.loreContext;
  }
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
  characterIds: string[],
  snapshot?: SessionSnapshot
): string => {
  try {
    let items: readonly import('@/types/inventory.types').InventoryItem[] | undefined;
    let equippedItemIds: string[] = [];

    if (snapshot?.inventory) {
      items = snapshot.inventory;
      equippedItemIds = items.filter((item) => item.equipped).map((item) => item.id);
    } else {
      if (!characterIds || characterIds.length === 0) return prompt;
      const characterId = characterIds[0];
      const { getCharacterItems } = useInventoryStore.getState();
      items = getCharacterItems(characterId);
      equippedItemIds = getEquippedItemIds(characterIds);
    }

    if (!items || items.length === 0) return prompt;

    const { context: inventorySection } = buildInventoryContext(
      items as import('@/types/inventory.types').InventoryItem[],
      {
        equippedItemIds,
      }
    );
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
  characterIds: string[],
  snapshot?: SessionSnapshot
): string => {
  try {
    const skillSections: string[] = [];

    if (snapshot?.character) {
      const character = snapshot.character;
      if (character.skills && character.skills.length > 0) {
        const skillString = formatSkillsForNarrative(character.skills);
        if (skillString) skillSections.push(`${character.name}: ${skillString}`);
      }
    } else {
      if (!characterIds || characterIds.length === 0) return prompt;
      const { characters } = useCharacterStore.getState();
      for (const characterId of characterIds) {
        const character = characters[characterId];
        if (!character || !character.skills || character.skills.length === 0) continue;
        const skillString = formatSkillsForNarrative(character.skills);
        if (skillString) skillSections.push(`${character.name}: ${skillString}`);
      }
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
  useAlignedChoices: boolean,
  snapshot?: SessionSnapshot
): string => {
  try {
    const playerCharacter = getPlayerCharacter(characterIds, snapshot);
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
  sessionId: EntityID,
  snapshot?: SessionSnapshot
): string => {
  try {
    const currentContext: SimpleNarrativeContext = {
      worldId: snapshot?.worldId ?? worldId,
      sessionId: snapshot?.sessionId ?? sessionId,
    };

    let decisions = playerDecisionTracker.getRelevantDecisions(
      currentContext,
      10,
      { worldId: currentContext.worldId, sessionId: currentContext.sessionId }
    );

    if (decisions.length === 0) {
      decisions = playerDecisionTracker.getRelevantDecisions(
        currentContext,
        10,
        { worldId: currentContext.worldId }
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
