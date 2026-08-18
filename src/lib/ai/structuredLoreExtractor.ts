/**
 * Structured Lore Extractor
 * Uses AI to extract structured lore data from narrative text
 */

import { createDefaultGeminiClient } from './defaultGeminiClient';
import { extractFencedJson } from './parseJSON';
import { normalizeText, NORM_NAME } from '@/lib/utils/textNormalization';
import type {
  LoreContinuityAnnotation,
  LoreContinuityKind,
  StructuredLoreExtraction,
} from '@/types/lore.types';

import Logger from '@/lib/utils/logger';
const logger = new Logger('StructuredLoreExtractor');

const CONTINUITY_KINDS: LoreContinuityKind[] = ['assertion', 'commitment', 'scene-change'];
const COMMITMENT_STATUSES = ['promised', 'delivered'] as const;

export interface ExtractStructuredLoreOptions {
  /**
   * Continuity topic labels already in the ledger. Passed to the model so a
   * repeated question lands on the same label and the guardrail can line up
   * the answers.
   */
  continuityTopics?: string[];
  /**
   * The player character's name. Reserved: the character store already owns the
   * player, so nothing extracted under that name can be new information.
   */
  playerCharacterName?: string;
}

/**
 * Extract structured lore from narrative text using AI
 */
export async function extractStructuredLore(
  narrativeText: string,
  existingLoreContext?: string,
  options?: ExtractStructuredLoreOptions
): Promise<StructuredLoreExtraction> {
  try {
    const geminiClient = createDefaultGeminiClient();
    const prompt = buildLoreExtractionPrompt(
      narrativeText,
      existingLoreContext,
      options?.continuityTopics,
      options?.playerCharacterName
    );
    const response = await geminiClient.generateContent(prompt);
    
    if (!response.content) {
      return getEmptyExtraction();
    }

    // Try to parse the fenced JSON response
    const jsonStr = extractFencedJson(response.content);
    if (jsonStr === null) {
      // A missing JSON block is a real parse failure. Surface it (loudly in dev)
      // and return nothing rather than fabricating lore from a prose regex,
      // which would silently mask prompt/parse regressions.
      logger.warn('No JSON block found in AI response; returning empty extraction');
      return getEmptyExtraction();
    }

    const extractedLore = JSON.parse(jsonStr) as StructuredLoreExtraction;
    return reservePlayerCharacterName(
      validateAndCleanExtraction(extractedLore),
      options?.playerCharacterName
    );

  } catch (error) {
    logger.warn('Failed to extract structured lore:', error);
    return getEmptyExtraction();
  }
}

/**
 * Build the prompt for lore extraction
 */
function buildLoreExtractionPrompt(
  narrativeText: string,
  existingLoreContext?: string,
  continuityTopics?: string[],
  playerCharacterName?: string
): string {
  const existingContext = existingLoreContext ? `\n\nExisting Lore Context:\n${existingLoreContext}` : '';
  const playerNameRule = playerCharacterName
    ? `\n- "${playerCharacterName}" is the PLAYER CHARACTER, not an NPC. Never create a character entry for them. If the text names a separate person who happens to share that name, that is a mistake in the prose — do not record them as a character.`
    : '';
  const topicHint =
    continuityTopics && continuityTopics.length > 0
      ? `\n- Continuity topics already in use (reuse the exact label when an event is about the same question, promise, or object): ${continuityTopics.join('; ')}`
      : '';

  return `You are a lore extraction system. Analyze the following narrative text and extract important facts as structured JSON.

Extract only NEW or SIGNIFICANT information that would be important for maintaining story consistency. Avoid extracting generic or obvious information.

Categories to extract:
- **Characters**: Named individuals with their roles/descriptions
- **Locations**: Named places with types and descriptions
- **Events**: Significant happenings that should be remembered
- **Rules**: Game mechanics, magic systems, or world rules mentioned
- **Relationships**: Important connections between entities (optional)

Rate importance as 'low', 'medium', or 'high' based on narrative significance.

Choose visibility for each fact:
- **world-shared**: enduring facts that should persist across sessions/campaigns
- **session-private**: temporary, session-specific, or uncertain facts

**ANTI-HALLUCINATION RULE**:
- ONLY extract entities that are EXPLICITLY MENTIONED in the narrative text below.
- DO NOT use your world knowledge or training data to infer entities.
- DO NOT add characters, locations, or events from the genre/setting that aren't directly stated.
- If you recognize the setting (e.g., Derry, Middle-earth), extract ONLY what appears in THIS specific narrative segment.

CRITICAL QUALITY RULES:
- Characters must be specific named individuals. Do NOT create character entries for unnamed or generic groups (e.g. "a guard", "unnamed warrior", "the villagers").
- If a person is unnamed, keep it as part of an event description instead of a character entity.
- Prefer stable locations ("Vaes Leisi", "Vaes Leisi marketplace") over micro-locations ("marketplace edge", "near a stall"). If you mention a micro-location, include it as an alias in the location entry.
- Keep events concise and non-redundant: **extract EXACTLY 3 or fewer** high-signal events that add lasting story state. Never exceed this limit.${playerNameRule}

CONTINUITY TAGGING (within the 3-event limit, prefer events that carry one of these):
- Add "continuity" to an event when it is one of:
  - "assertion": a character or the narration ANSWERS a factual question about the world (who owns what, what happened when, how much, whether something exists). A question being asked is not an assertion; only tag the answer. "topic" is a short label for the question (e.g. "mill debt"), "speaker" is who gave the answer ("narration" if unattributed).
  - "commitment": someone promises to do or provide something ("status": "promised"), or actually delivers on such a promise ("status": "delivered"). "topic" names the thing promised (e.g. "appraisal documents"), "speaker" is who promised.
  - "scene-change": the protagonist physically and lastingly changes the scene (tears, breaks, moves, takes, opens something). "topic" names the object.
- Leave "continuity" out for everything else.${topicHint}

Narrative Text:
${narrativeText}${existingContext}

Respond with ONLY a JSON block in this exact format:

\`\`\`json
{
  "characters": [
    {
      "name": "Character Name",
      "aliases": ["Nickname", "Title", "Alternative Name"],
      "description": "Brief description",
      "role": "their role/title",
      "importance": "low|medium|high",
      "visibility": "session-private|world-shared",
      "tags": ["tag1", "tag2"]
    }
  ],
  "locations": [
    {
      "name": "Location Name",
      "aliases": ["Common name", "Local nickname"],
      "type": "city|tavern|forest|etc",
      "description": "Brief description",
      "importance": "low|medium|high",
      "visibility": "session-private|world-shared",
      "tags": ["tag1", "tag2"]
    }
  ],
  "events": [
    {
      "description": "What happened",
      "significance": "Why it matters",
      "importance": "low|medium|high",
      "visibility": "session-private|world-shared",
      "relatedEntities": ["entity1", "entity2"],
      "continuity": { "kind": "assertion|commitment|scene-change", "topic": "short label", "speaker": "who said/promised it", "status": "promised|delivered" }
    }
  ],
  "rules": [
    {
      "rule": "The rule or mechanic",
      "context": "When/how it applies",
      "importance": "low|medium|high",
      "visibility": "session-private|world-shared",
      "tags": ["tag1", "tag2"]
    }
  ],
  "relationships": [
    {
      "from": "Entity 1",
      "to": "Entity 2",
      "type": "ally|enemy|mentor|etc",
      "description": "Nature of relationship"
    }
  ]
}
\`\`\`

**Note on aliases**: Include alternative names, nicknames, titles, or other ways the character or location is referred to in the narrative. Use the most formal/full name as the canonical "name" field.`;
}

/**
 * Validate and clean the extracted lore
 */
function validateAndCleanExtraction(extraction: unknown): StructuredLoreExtraction {
  const cleaned: StructuredLoreExtraction = {
    characters: [],
    locations: [],
    events: [],
    rules: [],
    relationships: []
  };

  // Type guard and validate characters
  const extractionObj = extraction as Record<string, unknown>;
  if (Array.isArray(extractionObj.characters)) {
    cleaned.characters = (extractionObj.characters as Array<Record<string, unknown>>)
      .filter((char) => char.name && typeof char.name === 'string')
      .map((char) => ({
        name: (char.name as string).trim(),
        aliases: Array.isArray(char.aliases) ?
          (char.aliases as unknown[]).filter((a) => typeof a === 'string').map(a => (a as string).trim()) : undefined,
        description: typeof char.description === 'string' ? char.description.trim() : undefined,
        role: typeof char.role === 'string' ? char.role.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(char.importance as string) ? char.importance as 'low' | 'medium' | 'high' : 'medium',
        visibility: ['session-private', 'world-shared'].includes(char.visibility as string) ? char.visibility as 'session-private' | 'world-shared' : undefined,
        tags: Array.isArray(char.tags) ? (char.tags as unknown[]).filter((t) => typeof t === 'string') as string[] : undefined
      }));
  }

  // Validate locations
  if (Array.isArray(extractionObj.locations)) {
    cleaned.locations = (extractionObj.locations as Array<Record<string, unknown>>)
      .filter((loc) => loc.name && typeof loc.name === 'string')
      .map((loc) => ({
        name: (loc.name as string).trim(),
        aliases: Array.isArray(loc.aliases) ?
          (loc.aliases as unknown[]).filter((a) => typeof a === 'string').map(a => (a as string).trim()) : undefined,
        type: typeof loc.type === 'string' ? loc.type.trim() : undefined,
        description: typeof loc.description === 'string' ? loc.description.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(loc.importance as string) ? loc.importance as 'low' | 'medium' | 'high' : 'medium',
        visibility: ['session-private', 'world-shared'].includes(loc.visibility as string) ? loc.visibility as 'session-private' | 'world-shared' : undefined,
        tags: Array.isArray(loc.tags) ? (loc.tags as unknown[]).filter((t) => typeof t === 'string') as string[] : undefined
      }));
  }

  // Validate events
  if (Array.isArray(extractionObj.events)) {
    cleaned.events = (extractionObj.events as Array<Record<string, unknown>>)
      .filter((event) => event.description && typeof event.description === 'string')
      .map((event) => ({
        description: (event.description as string).trim(),
        significance: typeof event.significance === 'string' ? event.significance.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(event.importance as string) ? event.importance as 'low' | 'medium' | 'high' : 'medium',
        visibility: ['session-private', 'world-shared'].includes(event.visibility as string) ? event.visibility as 'session-private' | 'world-shared' : undefined,
        relatedEntities: Array.isArray(event.relatedEntities) ?
          (event.relatedEntities as unknown[]).filter((e) => typeof e === 'string') as string[] : undefined,
        continuity: cleanContinuityAnnotation(event.continuity),
      }));
  }

  // Validate rules
  if (Array.isArray(extractionObj.rules)) {
    cleaned.rules = (extractionObj.rules as Array<Record<string, unknown>>)
      .filter((rule) => rule.rule && typeof rule.rule === 'string')
      .map((rule) => ({
        rule: (rule.rule as string).trim(),
        context: typeof rule.context === 'string' ? rule.context.trim() : undefined,
        importance: ['low', 'medium', 'high'].includes(rule.importance as string) ? rule.importance as 'low' | 'medium' | 'high' : 'medium',
        visibility: ['session-private', 'world-shared'].includes(rule.visibility as string) ? rule.visibility as 'session-private' | 'world-shared' : undefined,
        tags: Array.isArray(rule.tags) ? (rule.tags as unknown[]).filter((t) => typeof t === 'string') as string[] : undefined
      }));
  }

  // Validate relationships
  if (Array.isArray(extractionObj.relationships)) {
    cleaned.relationships = (extractionObj.relationships as Array<Record<string, unknown>>)
      .filter((rel) => rel.from && rel.to && rel.type && 
        typeof rel.from === 'string' && typeof rel.to === 'string' && typeof rel.type === 'string')
      .map((rel) => ({
        from: (rel.from as string).trim(),
        to: (rel.to as string).trim(),
        type: (rel.type as string).trim(),
        description: typeof rel.description === 'string' ? rel.description.trim() : undefined
      }));
  }

  return cleaned;
}

const canonicalizeName = (name: string): string =>
  normalizeText(name, NORM_NAME).trim().toLowerCase();

/**
 * Reserves the player character's name against the extracted lore.
 *
 * The character store already owns the player, so a lore character entry under
 * their name is never new information — it is either a duplicate of the sheet
 * or a third party the model minted wearing the player's name, which then reads
 * back as world fact in later prompts. An entry that only claims the name as an
 * alias goes too — entity resolution would otherwise merge it into the player.
 *
 * Events are left alone on purpose. Most events naming the player record real
 * on-screen player actions, and no cheap signal separates those from an
 * invented off-screen attribution, so filtering them would cost far more true
 * facts than it saved false ones.
 */
function reservePlayerCharacterName(
  extraction: StructuredLoreExtraction,
  playerCharacterName?: string
): StructuredLoreExtraction {
  const reserved = playerCharacterName ? canonicalizeName(playerCharacterName) : '';
  if (!reserved) return extraction;

  const characters = extraction.characters.filter((character) => {
    const claimsPlayerName =
      canonicalizeName(character.name) === reserved ||
      (character.aliases ?? []).some((alias) => canonicalizeName(alias) === reserved);
    if (claimsPlayerName) {
      logger.debug('Dropped extracted character claiming the player name', {
        name: character.name,
      });
    }
    return !claimsPlayerName;
  });

  return { ...extraction, characters };
}

const trimmedString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

/** An annotation with an unknown kind is dropped; bad optional fields are just omitted. */
function cleanContinuityAnnotation(raw: unknown): LoreContinuityAnnotation | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const annotation = raw as Record<string, unknown>;
  const kind = annotation.kind as LoreContinuityKind;
  if (!CONTINUITY_KINDS.includes(kind)) return undefined;
  const status = annotation.status as (typeof COMMITMENT_STATUSES)[number];
  return {
    kind,
    topic: trimmedString(annotation.topic),
    speaker: trimmedString(annotation.speaker),
    status: COMMITMENT_STATUSES.includes(status) ? status : undefined,
  };
}

/**
 * Return empty extraction structure
 */
function getEmptyExtraction(): StructuredLoreExtraction {
  return {
    characters: [],
    locations: [],
    events: [],
    rules: [],
    relationships: []
  };
}
