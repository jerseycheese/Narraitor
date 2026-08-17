import type { EntityID } from '../types/common.types';
import type { StructuredLoreExtraction, LoreFact, LoreCategory, LoreSource, EntityResolutionResult } from '../types/lore.types';
import { logger } from '@/lib/utils/logger';
import { safeTrim } from '@/lib/utils';
import { normalizeText, NORM_NAME } from '../lib/utils/textNormalization';
import {
  generateLoreKey,
  shouldStoreExtractedCharacterName,
  canonicalizeLocationName,
  importanceRank,
  MAX_EVENTS_PER_EXTRACTION,
} from './loreStore.helpers';
import type { EntityResolutionContext, ResolveEntityOptions } from './loreStore.resolution';

/**
 * Structured lore extraction logic for the lore store
 * Processes AI-extracted entities and adds them to the store with appropriate filtering
 */

export interface AddStructuredLoreContext {
  addFact: (
    key: string,
    value: string,
    category: LoreCategory,
    source: LoreSource,
    worldId: EntityID,
    sessionId?: EntityID,
    metadata?: LoreFact['metadata'],
    visibility?: 'session-private' | 'world-shared'
  ) => EntityID;
  setAliases: (id: EntityID, aliases: string[]) => void;
  addAlias: (id: EntityID, alias: string) => void;
  getFacts: (options?: { worldId?: EntityID }) => LoreFact[];
  getFact: (id: EntityID) => LoreFact | undefined;
  resolveEntity: (
    name: string,
    category: LoreCategory,
    worldId: EntityID,
    options: ResolveEntityOptions,
    context: EntityResolutionContext
  ) => EntityResolutionResult;
}

/**
 * Adds structured lore extraction to the store, which means generic entities are
 * filtered out and duplicates are avoided before anything is persisted.
 *
 * @param extraction - The structured lore extracted by AI.
 * @param worldId - The world ID to add facts to.
 * @param sessionId - Optional session ID for fact tracking.
 * @param context - Store methods needed for adding facts.
 * @returns void
 */
export function addStructuredLoreImpl(
  extraction: StructuredLoreExtraction,
  worldId: EntityID,
  sessionId: EntityID | undefined,
  context: AddStructuredLoreContext
): void {
  logger.info('[LoreStore] addStructuredLore called', {
    worldId,
    sessionId,
    extraction: {
      characters: extraction.characters.length,
      locations: extraction.locations.length,
      events: extraction.events.length,
      rules: extraction.rules.length,
    },
  });

  const { addFact, setAliases, addAlias, getFacts, getFact, resolveEntity } = context;

  const existingFacts = getFacts({ worldId });
  const existingKeys = new Set(existingFacts.map((fact) => fact.key));
  const existingFactsByKey = new Map(existingFacts.map((fact) => [fact.key, fact]));
  logger.info('[LoreStore] Existing facts count', { count: existingFacts.length });

  const addedCount = { characters: 0, locations: 0, events: 0, rules: 0 };

  // Process characters with name filtering
  extraction.characters
    .filter((char) => shouldStoreExtractedCharacterName(char.name))
    .forEach((char) => {
      const key = generateLoreKey(worldId, 'character', char.name);
      if (!existingKeys.has(key)) {
        const result = resolveEntity(
          char.name,
          'characters',
          worldId,
          {
            source: 'narrative',
            sessionId,
            metadata: {
              description: char.description,
              type: char.role,
              importance: char.importance || 'medium',
              tags: char.tags,
            },
            visibility: char.visibility ?? (sessionId ? 'session-private' : 'world-shared'),
          },
          {
            getFacts,
            getFact,
            addFact,
            addAlias,
          }
        );

        // Add aliases if extracted by AI
        if (char.aliases && char.aliases.length > 0) {
          char.aliases.forEach((alias) => addAlias(result.entity.id, alias));
        }

        if (result.isNew) {
          addedCount.characters++;
          existingKeys.add(key);
          existingFactsByKey.set(key, result.entity);
          logger.debug('[LoreStore] Added character fact', {
            name: char.name,
            key,
            factId: result.entity.id,
          });
        }
      } else {
        const existing = existingFactsByKey.get(key);
        if (existing && char.aliases && char.aliases.length > 0) {
          setAliases(existing.id, [...(existing.aliases || []), ...char.aliases]);
        }
      }
    });

  // Process locations with canonicalization
  extraction.locations.forEach((loc) => {
    const { canonicalName, derivedAliases } = canonicalizeLocationName(loc.name);
    if (!canonicalName) {
      return;
    }

    const key = generateLoreKey(worldId, 'location', canonicalName);
    const aliasesToApply = [
      ...(Array.isArray(loc.aliases) ? loc.aliases : []),
      ...derivedAliases,
    ].filter(Boolean);

    if (!existingKeys.has(key)) {
      const result = resolveEntity(
        canonicalName,
        'locations',
        worldId,
        {
          source: 'narrative',
          sessionId,
          metadata: {
            description: loc.description,
            type: loc.type,
            importance: loc.importance || 'medium',
            tags: loc.tags,
          },
          visibility: loc.visibility ?? (sessionId ? 'session-private' : 'world-shared'),
        },
        {
          getFacts,
          getFact,
          addFact,
          addAlias,
        }
      );

      if (aliasesToApply.length > 0) {
        aliasesToApply.forEach((alias) => addAlias(result.entity.id, alias));
      }

      if (result.isNew) {
        addedCount.locations++;
        existingKeys.add(key);
        existingFactsByKey.set(key, result.entity);
        logger.debug('[LoreStore] Added location fact', {
          name: canonicalName,
          key,
          factId: result.entity.id,
        });
      }
    } else {
      const existing = existingFactsByKey.get(key);
      if (existing && aliasesToApply.length > 0) {
        setAliases(existing.id, [...(existing.aliases || []), ...aliasesToApply]);
      }
    }
  });

  // Process events with deduplication and limiting
  const existingEventValues = new Set(
    existingFacts
      .filter((fact) => fact.category === 'events')
      .map((fact) => normalizeText(fact.value, NORM_NAME).toLowerCase())
      .filter(Boolean)
  );

  const eventCandidates = extraction.events
    .filter((event) => typeof event.description === 'string' && safeTrim(event.description).length > 0)
    .sort((a, b) => {
      const rankDiff = importanceRank(b.importance as string | undefined) - importanceRank(a.importance as string | undefined);
      if (rankDiff !== 0) return rankDiff;
      return safeTrim(b.description).length - safeTrim(a.description).length;
    });

  const addedEventValues = new Set<string>();
  let eventsAdded = 0;

  eventCandidates.forEach((event) => {
    if (eventsAdded >= MAX_EVENTS_PER_EXTRACTION) {
      return;
    }

    const normalizedDescription = normalizeText(event.description, NORM_NAME).toLowerCase();
    if (!normalizedDescription) {
      return;
    }
    if (existingEventValues.has(normalizedDescription) || addedEventValues.has(normalizedDescription)) {
      return;
    }

    const key = generateLoreKey(worldId, 'event', event.description, 30);
    if (!existingKeys.has(key)) {
      addFact(key, event.description, 'events', 'narrative', worldId, sessionId, {
        description: event.significance,
        importance: event.importance || 'medium',
        relatedEntities: event.relatedEntities,
        continuity: event.continuity,
      }, event.visibility ?? (sessionId ? 'session-private' : 'world-shared'));
      addedCount.events++;
      eventsAdded++;
      addedEventValues.add(normalizedDescription);
      logger.debug('[LoreStore] Added event fact', { description: event.description, key });
    }
  });

  // Process rules
  extraction.rules.forEach((rule) => {
    const key = generateLoreKey(worldId, 'rule', rule.rule, 30);
    if (!existingKeys.has(key)) {
      addFact(key, rule.rule, 'rules', 'narrative', worldId, sessionId, {
        description: rule.context,
        importance: rule.importance || 'medium',
        tags: rule.tags,
      }, rule.visibility ?? (sessionId ? 'session-private' : 'world-shared'));
      addedCount.rules++;
      logger.debug('[LoreStore] Added rule fact', { rule: rule.rule, key });
    }
  });

  logger.info('[LoreStore] addStructuredLore complete', { addedCount });
  const updatedFactsCount = getFacts({ worldId }).length;
  logger.info('[LoreStore] Total facts after addition', { count: updatedFactsCount });
}
