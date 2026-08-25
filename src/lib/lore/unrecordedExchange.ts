/**
 * Unrecorded Exchange (#1857)
 *
 * The player types "ask Davies to repeat publicly what he told me privately"
 * and the model backfills a conversation the story never told; the lore
 * extractor then records the invention as canon. The ledger-fed contract
 * (#1856) cannot reach this, because a conversation that never happened leaves
 * nothing in the ledger to assert.
 *
 * Co-presence is already recorded, though. `NarrativeMetadata.characterIds`
 * and `metadata.speakerId` carry the NPCs an AI pass judged PHYSICALLY present
 * with the protagonist, per segment. So the contract can assert something true
 * instead of an absence: "Davies has shared three narrated scenes with you and
 * has never been alone with you." No new store, no new AI call.
 *
 * Like `continuityLedger.ts`, this module takes data as parameters and imports
 * no stores; store reads live in `lib/ai/narrativeGenerator.continuity.ts`.
 */

import type { EntityID } from '../../types/common.types';
import { escapeRegExp } from './continuityLedger';

/**
 * The player's action asserts a prior exchange aimed at them: a past-tense
 * telling with the player on the receiving end, or a named prior meeting.
 * Deliberately anchored on the past tense — "tell Davies privately that I'll
 * vote no" proposes a conversation rather than recalling one.
 */
const PRIOR_EXCHANGE_CLAIM =
  /\b(?:(?:told|admitted|confided|confessed|promised|mentioned|whispered|said)\s+(?:it\s+)?(?:to\s+)?me\b|what\s+(?:he|she|they|you)\s+(?:told|said|admitted|confided|confessed|promised|mentioned|whispered)\b|(?:our|that|the)\s+(?:private\s+|earlier\s+|previous\s+)?(?:conversation|talk|chat|exchange|meeting|discussion)\b|when\s+we\s+(?:last\s+)?(?:spoke|talked|met)\b|(?:you|he|she|they)\s+already\s+(?:told|said|admitted|promised)\b)/i;

/**
 * Prose in which the NPC recounts the exchange instead of refusing the premise.
 * Looser than the sibling detectors' lexicons on purpose: this one only runs on
 * a turn where the player already typed a false-premise action naming this NPC,
 * so the whole segment is the answer to that claim and an extra correction call
 * costs a rare turn rather than every turn.
 */
const RECOUNT_LEXICON =
  /\b(?:(?:as|what|like)\s+(?:I|he|she|they)\s+(?:told|said\s+to|mentioned\s+to|promised)\s+(?:you|me|him|her|them)\b|(?:I|he|she|they)\s+told\s+(?:you|him|her|them)\b|told\s+(?:you|me)\s+(?:privately|in\s+private|in\s+confidence)\b|(?:when|since)\s+we\s+(?:last\s+)?(?:spoke|talked|met)\b|(?:in|during)\s+(?:our|that)\s+(?:private\s+)?(?:conversation|talk|exchange|meeting)\b|our\s+(?:private\s+)?(?:conversation|talk|chat|exchange|meeting)\b|(?:I|he|she|they)\s+confided\b|(?:repeat|repeats|repeated|repeating)\s+(?:what|the\s+words)\b|(?:as|like)\s+(?:I|he|she|they)\s+said\s+(?:before|earlier|to\s+you)\b)/i;

/**
 * Refusing the premise is the behavior this whole change wants, so any negated
 * sentence is left alone. Broad on purpose: "I never told you that" and "what I
 * told you was not a threat" both read as recounting to the lexicon above, and
 * correcting a denial would be worse than missing an invention.
 */
const DENIAL_LEXICON =
  /\b(?:never|no\s+such|nothing|not|nor)\b|n['’]t\b/i;

/** Co-presence per NPC, read off the segments the session already persisted. */
export interface SharedSceneRecord {
  /** Narrated scenes in which this NPC was present with the protagonist. */
  scenes: number;
  /** At least one of those scenes had this NPC and nobody else present. */
  aloneTogether: boolean;
}

/** The only segment fields this module reads. */
export interface CoPresenceSegment {
  metadata?: {
    characterIds?: EntityID[];
    speakerId?: EntityID;
  };
}

/** What the player's action claims, once it resolves to a rostered NPC. */
export interface UnrecordedExchangeClaim {
  npcId: EntityID;
  name: string;
  /** The player's own phrasing, trimmed for the prompt. */
  excerpt: string;
}

const MAX_CLAIM_LENGTH = 200;

/**
 * Counts, per NPC, the narrated scenes shared with the protagonist and whether
 * any of them left the two alone. A scene counts the segment's present NPCs
 * (`characterIds`) plus whoever spoke (`speakerId`); "alone together" means
 * exactly one NPC in that set.
 *
 * Feed this the whole session, never `previousSegments` — that is the last
 * three segments, and an NPC first met at turn 4 would read as never met at
 * turn 20, which puts a false fact in the prompt.
 */
export function countSharedScenes(
  segments: CoPresenceSegment[]
): Record<EntityID, SharedSceneRecord> {
  const counts: Record<EntityID, SharedSceneRecord> = {};

  for (const segment of segments ?? []) {
    const present = new Set<EntityID>();
    for (const id of segment?.metadata?.characterIds ?? []) {
      if (id) present.add(id);
    }
    const speakerId = segment?.metadata?.speakerId;
    if (speakerId) present.add(speakerId);
    if (present.size === 0) continue;

    const alone = present.size === 1;
    for (const npcId of present) {
      const record = counts[npcId] ?? { scenes: 0, aloneTogether: false };
      counts[npcId] = {
        scenes: record.scenes + 1,
        aloneTogether: record.aloneTogether || alone,
      };
    }
  }

  return counts;
}

/**
 * Reads the player's typed action for a claim about a prior exchange with a
 * named NPC. Names resolve against the NPC store roster only, which is what
 * keeps a name the model invented from ever entering the mechanism.
 */
export function detectUnrecordedExchangeClaim(
  actionText: string,
  npcNames: Record<EntityID, string>
): UnrecordedExchangeClaim | null {
  const text = actionText?.trim();
  if (!text || !PRIOR_EXCHANGE_CLAIM.test(text)) return null;

  for (const [npcId, name] of Object.entries(npcNames ?? {})) {
    const trimmed = name?.trim();
    if (!trimmed) continue;
    if (!new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, 'i').test(text)) continue;
    return { npcId, name: trimmed, excerpt: text.slice(0, MAX_CLAIM_LENGTH) };
  }

  return null;
}

/** True when this sentence recounts the exchange rather than refusing it. */
export function recountsUnrecordedExchange(sentence: string): boolean {
  if (!sentence) return false;
  if (DENIAL_LEXICON.test(sentence)) return false;
  return RECOUNT_LEXICON.test(sentence);
}
