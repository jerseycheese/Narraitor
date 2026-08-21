import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import type { Character as StoreCharacter } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';
import type { EntityID } from '@/types/common.types';
import type { World } from '@/types/world.types';
import type { CharacterGoal } from '@/types/personalization.types';
import type { NarrativeGoal } from '@/types/goal.types';
import { safeTrim } from '@/lib/utils';
import {
  summarizeThreadHighlight,
  describeCharacterRelationship,
} from '@/lib/utils/worldStateFormatters';
import { playerDecisionTracker } from './playerDecisionTracker';
import { formatDecisions } from './simpleDecisionFormatter';
import { type SimpleNarrativeContext } from './simpleDecisionRelevance';
import { buildCharacterPromptSection } from './personalizationEngine';
const MAX_OTHER_CHARACTER_THREADS = 3;
const MAX_CROSS_CHARACTER_REFERENCES = 2;
const PROMPT_THREAD_SUMMARY_LENGTH = 160;
export const enhancePromptWithPersonalization = async (
  prompt: string,
  worldId: EntityID,
  characterIds: string[],
  sessionId?: EntityID
): Promise<string> => {
  try {
    // Throws when the world is gone, which the catch below turns into "leave
    // the prompt alone" — personalization is never worth failing generation.
    getWorld(worldId);
    const { characters } = useCharacterStore.getState();
    const playerCharacterId = characterIds[0];
    const storeCharacter = playerCharacterId ? characters[playerCharacterId] : null;
    if (!storeCharacter) {
      return prompt;
    }
    const playerCharacter = convertToPersonalizationCharacter(storeCharacter);
    let relevantDecisions = [] as ReturnType<
      typeof playerDecisionTracker.getRelevantDecisions
    >;
    let decisionHistory = '';
    if (sessionId) {
      // Try session-specific decisions first
      const currentContext: SimpleNarrativeContext = { worldId, sessionId };
      relevantDecisions = playerDecisionTracker.getRelevantDecisions(
        currentContext,
        10,
        { worldId, sessionId }
      );

      // Fallback to world-wide decisions if session has none
      if (relevantDecisions.length === 0) {
        relevantDecisions = playerDecisionTracker.getRelevantDecisions(
          currentContext,
          10,
          { worldId }
        );
      }

      decisionHistory = formatDecisions(relevantDecisions);
    } else {
      // No session context - get world-wide decisions using relevance scoring
      const currentContext: SimpleNarrativeContext = { worldId };
      relevantDecisions = playerDecisionTracker.getRelevantDecisions(
        currentContext,
        10,
        { worldId }
      );
      decisionHistory = formatDecisions(relevantDecisions);
    }

    const aiContext = sessionId
      ? await useAiContextStore.getState().buildContextForSession(sessionId)
      : null;
    const narrativeGoals = aiContext?.activeGoals || [];
    const characterGoals = convertToCharacterGoals(narrativeGoals);

    const enhancementText = buildCharacterPromptSection({
      name: playerCharacter.name,
      attributes: playerCharacter.attributes,
      skills: playerCharacter.skills,
      goals: characterGoals,
      decisions: relevantDecisions,
    });
    const cleanedEnhancementText = prompt.includes('CURRENT NARRATIVE GOALS:')
      ? enhancementText
          .split('\n\n')
          .filter((section) => !section.startsWith('ACTIVE GOALS:'))
          .join('\n\n')
      : enhancementText;

    let personalizationSection = '';
    if (safeTrim(cleanedEnhancementText)) {
      personalizationSection += `\n\n${cleanedEnhancementText}`;
    }
    if (decisionHistory) {
      personalizationSection += decisionHistory;
    }

    const otherCharacterContext = buildOtherCharacterContext(
      worldId,
      playerCharacterId
    );
    if (otherCharacterContext) {
      personalizationSection += `\n\n${otherCharacterContext}\nWeave these concurrent storylines naturally when they influence the current scene, but avoid forced references.`;
    }

    if (!safeTrim(personalizationSection)) {
      return prompt;
    }

    return `${prompt}${personalizationSection}`;
  } catch {
    return prompt;
  }
};

export const convertToPersonalizationCharacter = (
  storeCharacter: StoreCharacter
): {
  id: string;
  name: string;
  background: string;
  attributes:
    | Record<string, number>
    | Array<{ attributeId: string; value: number }>;
  skills:
    | Array<{ name: string; level: number; worldSkillId?: string }>
    | Array<{ skillId: string; level: number }>;
  createdAt: string;
  updatedAt: string;
} => {
  const backgroundValue: unknown = storeCharacter.background as unknown;
  const background =
    typeof backgroundValue === 'string'
      ? backgroundValue
      : ((backgroundValue as { summary?: string; history?: string } | null)
          ?.summary ??
        (backgroundValue as { history?: string } | null)?.history ??
        storeCharacter.description ??
        '');

  return {
    id: storeCharacter.id,
    name: storeCharacter.name,
    background,
    // attributeId is a prompt label here, never a lookup key, so prefer the
    // display name. A world attribute's id is a generated `attr_<uuid>` and
    // the model can't read anything into that.
    attributes: Array.isArray(storeCharacter.attributes)
      ? storeCharacter.attributes.map((attribute) => ({
          attributeId: String(
            attribute.name || attribute.worldAttributeId || attribute.id
          ),
          value: Number(attribute.modifiedValue ?? attribute.baseValue ?? 0),
        }))
      : {},
    skills: Array.isArray(storeCharacter.skills)
      ? storeCharacter.skills.map((skill) => ({
          name: skill.name,
          level: skill.level,
          worldSkillId: skill.worldSkillId,
        }))
      : [],
    createdAt: storeCharacter.createdAt,
    updatedAt: storeCharacter.updatedAt,
  };
};

const convertToCharacterGoals = (
  narrativeGoals: NarrativeGoal[]
): CharacterGoal[] =>
  narrativeGoals.map((goal) => ({
    id: goal.id,
    description: goal.description || goal.title,
    priority: mapGoalPriority(goal.priority),
    progress: calculateGoalProgress(goal),
    establishedAt: goal.createdAt,
    isActive: goal.status === 'active',
  }));

const mapGoalPriority = (priority: string): 'primary' | 'secondary' | 'minor' => {
  switch (priority) {
    case 'critical':
    case 'high':
      return 'primary';
    case 'medium':
      return 'secondary';
    case 'low':
    default:
      return 'minor';
  }
};

const calculateGoalProgress = (goal: NarrativeGoal): number => {
  if (goal.status === 'completed') return 100;
  if (goal.status === 'abandoned') return 0;

  const mentionCount = Number(goal.mentionCount) || 0;
  if (mentionCount === 0) return 0;
  if (mentionCount >= 10) return 80;
  if (mentionCount >= 5) return 60;
  if (mentionCount >= 3) return 40;
  return 20;
};

const buildOtherCharacterContext = (
  worldId: EntityID,
  activeCharacterId: EntityID
): string | null => {
  try {
    const { worldStates } = useWorldStore.getState();
    const worldState = worldStates[worldId];
    if (!worldState?.playerCharacterThreads) {
      return null;
    }

    const threads = Object.values(worldState.playerCharacterThreads)
      .filter((thread) => thread.characterId !== activeCharacterId)
      .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
      .slice(0, MAX_OTHER_CHARACTER_THREADS);

    if (threads.length === 0) {
      return null;
    }

    const { characters } = useCharacterStore.getState();
    const relationshipMap =
      worldState.characterRelationships?.[activeCharacterId] ?? {};

    const lines = threads.map((thread) => {
      const name =
        characters[thread.characterId]?.name ??
        `Character ${thread.characterId}`;
      const highlight =
        summarizeThreadHighlight(thread, PROMPT_THREAD_SUMMARY_LENGTH) ??
        'No recent activity recorded yet.';

      const relationship = relationshipMap[thread.characterId];
      const relationshipDescriptor = relationship
        ? ` Relationship: ${describeCharacterRelationship(relationship)}.`
        : '';

      const referencesToActive =
        thread.crossCharacterReferences?.filter(
          (reference) => reference.characterId === activeCharacterId
        ) ?? [];
      const recentReferences = referencesToActive.slice(
        -MAX_CROSS_CHARACTER_REFERENCES
      );
      const referenceDescriptor =
        recentReferences.length > 0
          ? ` Recent cross-over: ${recentReferences
              .map((reference) => {
                const summary = reference.summary.trim();
                return summary.length > PROMPT_THREAD_SUMMARY_LENGTH
                  ? `${summary.slice(0, PROMPT_THREAD_SUMMARY_LENGTH - 3)}...`
                  : summary;
              })
              .join('; ')}.`
          : '';

      return `- ${name}: ${highlight}.${relationshipDescriptor}${referenceDescriptor}`;
    });

    return `OTHER PLAYER CHARACTERS (SHARED WORLD CONTEXT):\n${lines.join('\n')}`;
  } catch {
    return null;
  }
};

const getWorld = (worldId: EntityID): World => {
  const { worlds } = useWorldStore.getState();
  const world = worlds[worldId];

  if (!world) {
    throw new Error(`World not found: ${worldId}`);
  }

  return world;
};
