import { Decision, NarrativeSegment, Consequence } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId, getTimestamp, safeTrim } from '../lib/utils';
import {
  NPCRelationshipUpdate,
  WorldStateMajorEventInput,
} from '../types/world-state.types';

/**
 * Pure extraction of structured world-state impacts from a selected decision
 * option. No store coupling — narrativeStore.decisions.ts consumes the result
 * and pushes it into worldStore.
 */
export interface ExtractedWorldStateImpact {
  relationships: Record<EntityID, NPCRelationshipUpdate>;
  events: WorldStateMajorEventInput[];
  /** Net lawful(+)/chaotic(-) shift from 'alignment' consequences. */
  alignmentDelta: number;
}

export type DecisionWorldStatePayload = {
  worldId: EntityID;
  sessionId: EntityID;
  relationships: Record<EntityID, NPCRelationshipUpdate>;
  events: WorldStateMajorEventInput[];
  alignmentDelta: number;
};

const MAJOR_EVENT_PATTERNS: RegExp[] = [
  /world[-\s]?changing/i,
  /major\s+event/i,
  /kingdom\s+(?:falls|celebrates|rejoices|crumbles)/i,
  /celebration/i,
  /catastrophe/i,
  /disaster/i,
  /uprising/i,
  /war\s+erupts/i,
  /reputation\s+(?:soars|plummets|spreads)/i,
];

const parseNumericValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const match = value.match(/-?\d+/);
    if (match) {
      const parsed = Number(match[0]);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
  }
  return undefined;
};

const ensureRelationshipUpdate = (
  relationships: Record<EntityID, NPCRelationshipUpdate>,
  npcId: EntityID,
  timestamp: string
): NPCRelationshipUpdate => {
  const existing = relationships[npcId];
  if (existing) {
    if (!existing.lastInteraction) {
      existing.lastInteraction = timestamp;
    }
    return existing;
  }

  const update: NPCRelationshipUpdate = { lastInteraction: timestamp };
  relationships[npcId] = update;
  return update;
};

const queueMajorEvent = (
  description: string | undefined,
  characterId: EntityID | undefined,
  processed: Set<string>,
  events: WorldStateMajorEventInput[]
) => {
  const trimmed = safeTrim(description ?? '');
  if (!trimmed) {
    return;
  }

  const key = trimmed.toLowerCase();
  if (processed.has(key)) {
    return;
  }

  processed.add(key);
  events.push({
    id: generateUniqueId('event'),
    description: trimmed,
    timestamp: getTimestamp(),
    characterId: (characterId ?? 'unknown-character') as EntityID,
  });
};

export const extractWorldStateImpacts = (
  decision: Decision,
  selectedOption: Decision['options'][number],
  characterId?: EntityID
): ExtractedWorldStateImpact => {
  const relationships: Record<EntityID, NPCRelationshipUpdate> = {};
  const events: WorldStateMajorEventInput[] = [];
  const processedDescriptions = new Set<string>();
  const timestamp = getTimestamp();
  let alignmentDelta = 0;

  const handleConsequence = (consequence?: Consequence) => {
    if (!consequence) {
      return;
    }

    if (consequence.type === 'alignment') {
      const numeric = parseNumericValue(consequence.value);
      if (typeof numeric === 'number') {
        alignmentDelta += numeric;
      }
      return;
    }

    if (consequence.type === 'relationship') {
      const npcId = consequence.targetId;
      if (!npcId) {
        return;
      }

      const update = ensureRelationshipUpdate(relationships, npcId, timestamp);
      const value = consequence.value;

      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        if (typeof record.trust === 'number') {
          update.trust = record.trust;
        }
        if (typeof record.sentiment === 'number') {
          update.sentiment = record.sentiment;
        }
        if (typeof record.trustDelta === 'number') {
          update.trustDelta = (update.trustDelta ?? 0) + (record.trustDelta as number);
        }
        if (typeof record.sentimentDelta === 'number') {
          update.sentimentDelta = (update.sentimentDelta ?? 0) + (record.sentimentDelta as number);
        }
        if (typeof record.lastInteraction === 'string') {
          update.lastInteraction = record.lastInteraction;
        }
      } else {
        const numeric = parseNumericValue(value);
        if (typeof numeric === 'number') {
          if (consequence.action === 'add') {
            update.trustDelta = (update.trustDelta ?? 0) + numeric;
          } else if (consequence.action === 'remove') {
            update.trustDelta = (update.trustDelta ?? 0) - numeric;
          } else {
            update.trust = numeric;
          }
        }
      }

      update.lastInteraction = update.lastInteraction ?? timestamp;

      if (typeof consequence.description === 'string') {
        queueMajorEvent(consequence.description, characterId, processedDescriptions, events);
      }
      return;
    }

    if (consequence.type === 'narrative') {
      const description = typeof consequence.value === 'string'
        ? consequence.value
        : consequence.description;
      queueMajorEvent(description, characterId, processedDescriptions, events);
    }
  };

  const optionConsequences = selectedOption.consequences ?? [];
  optionConsequences.forEach(handleConsequence);
  (decision.consequences ?? []).forEach(handleConsequence);

  const candidateTexts: string[] = [];
  const optionText = safeTrim(selectedOption.text || '');
  if (optionText) candidateTexts.push(optionText);

  const customText = safeTrim((selectedOption as { customText?: string }).customText ?? '');
  if (customText) candidateTexts.push(customText);

  const hintText = safeTrim((selectedOption as { hint?: string }).hint ?? '');
  if (hintText) candidateTexts.push(hintText);

  const decisionPrompt = safeTrim(decision.prompt || '');
  if (decisionPrompt) candidateTexts.push(decisionPrompt);

  const consequenceDescriptions = [...optionConsequences, ...(decision.consequences ?? [])]
    .map((cons) => safeTrim(cons?.description || (typeof cons?.value === 'string' ? cons.value : '')))
    .filter(Boolean) as string[];

  candidateTexts.push(...consequenceDescriptions);

  candidateTexts.forEach(text => {
    const sentences = text.split(/(?<=[.!?])\s+/u);
    sentences.forEach(sentence => {
      const trimmed = safeTrim(sentence);
      if (!trimmed) {
        return;
      }

      if (MAJOR_EVENT_PATTERNS.some(pattern => pattern.test(trimmed))) {
        queueMajorEvent(trimmed, characterId, processedDescriptions, events);
      }
    });
  });

  for (const [npcId, update] of Object.entries(relationships)) {
    const meaningful =
      typeof update.sentiment !== 'undefined' ||
      typeof update.sentimentDelta !== 'undefined' ||
      typeof update.trust !== 'undefined' ||
      typeof update.trustDelta !== 'undefined';

    if (!meaningful) {
      delete relationships[npcId];
    } else if (!update.lastInteraction) {
      update.lastInteraction = timestamp;
    }
  }

  return {
    relationships,
    events,
    alignmentDelta,
  };
};

/**
 * Extracts narrative context from decision prompt and segments
 */
export const extractDecisionContext = (
  prompt: string,
  segments: NarrativeSegment[]
): {
  location?: string;
  situation?: string;
  charactersPresent?: string[];
} => {
  const context: {
    location?: string;
    situation?: string;
    charactersPresent?: string[];
  } = {};

  // Extract location from segments (most recent with location)
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (segment?.metadata?.location) {
      context.location = segment.metadata.location;
      break;
    }
  }

  // Extract characters from segments (collect all mentioned characters)
  const allCharacterIds = new Set<string>();
  segments.forEach(segment => {
    if (segment?.characterIds) {
      segment.characterIds.forEach(id => allCharacterIds.add(id));
    }
    if (segment?.metadata?.characterIds) {
      segment.metadata.characterIds.forEach(id => allCharacterIds.add(id));
    }
  });

  // Extract characters from prompt text (capitalized names, possibly with hyphens/apostrophes)
  const characterRegex = /\b([A-Z][a-z]+(?:[-' ][A-Z][a-z]+)*)\b/g;
  const promptCharacterMatches = prompt.match(characterRegex) || [];
  promptCharacterMatches.forEach(char => allCharacterIds.add(char));

  if (allCharacterIds.size > 0) {
    context.charactersPresent = Array.from(allCharacterIds);
  }

  // Use prompt as situation context
  context.situation = prompt;

  return context;
};
