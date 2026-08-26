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
 * Two tiers, because the single sharpest failure mode here is firing on a
 * conversation the story DID narrate. "Repeat what he told me at the council
 * meeting" refers to a scene the player watched, with others present, so
 * `aloneTogether` would be false and the contract would assert that nothing
 * passed between them off the page. Half of that is true and the operative
 * half is false, and it would instruct the model to deny real canon.
 *
 * So a claim needs either a phrase that names an off-page private exchange on
 * its own, or a past communication aimed at the player PLUS a marker putting it
 * off the page. The false negatives that buys are deliberate: a missed catch
 * costs one rare turn, and a false positive rewrites established canon into a
 * denial, which is worse than the bug.
 */
const SELF_SUFFICIENT_CLAIM =
  /\b(?:(?:our|that|the|your)\s+(?:private|secret|confidential|off-the-record)\s+(?:conversation|talk|chat|exchange|meeting|discussion|word)|confided\s+(?:in|to)\s+me|in\s+confidence)\b/i;

/** A past communication with the player on the receiving end. */
const PAST_COMMUNICATION_TO_PLAYER =
  /\b(?:(?:told|admitted|confided|confessed|promised|mentioned|whispered|revealed|swore)\s+(?:it\s+)?(?:to\s+)?me\b|what\s+(?:he|she|they|you)\s+(?:told|said|admitted|confided|confessed|promised|mentioned|whispered|revealed)\b|(?:he|she|they|you)\s+(?:told|said\s+to|admitted\s+to|promised|whispered\s+to)\s+me\b)/i;

/** Puts that communication somewhere the story never showed. */
const OFF_PAGE_MARKER =
  /\b(?:privately|in\s+private|in\s+confidence|confidentially|off\s+the\s+record|behind\s+closed\s+doors|just\s+between\s+us|between\s+you\s+and\s+me|alone|in\s+secret|secretly|when\s+we\s+(?:last\s+)?(?:spoke|talked|met))\b/i;

const claimsUnrecordedExchange = (text: string): boolean =>
  SELF_SUFFICIENT_CLAIM.test(text) ||
  (PAST_COMMUNICATION_TO_PLAYER.test(text) && OFF_PAGE_MARKER.test(text));

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
  if (!text || !claimsUnrecordedExchange(text)) return null;

  const named = Object.entries(npcNames ?? {}).filter(([, name]) => {
    const trimmed = name?.trim();
    if (!trimmed) return false;
    const terms = [trimmed, ...trimmed.split(/\s+/).filter(Boolean)];
    return terms.some((term) =>
      new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(text)
    );
  });

  // Exactly one, or nothing. "Ask Davies why Mira told me the vote was fixed"
  // names two, and taking the first would have Davies deny a conversation the
  // player attributed to Mira. A miss is cheap; a wrong denial is not.
  if (named.length !== 1) return null;

  const [npcId, name] = named[0];
  return { npcId, name: name.trim(), excerpt: text.slice(0, MAX_CLAIM_LENGTH) };
}

/** True when this sentence recounts the exchange rather than refusing it. */
export function recountsUnrecordedExchange(sentence: string): boolean {
  if (!sentence) return false;
  if (DENIAL_LEXICON.test(sentence)) return false;
  return RECOUNT_LEXICON.test(sentence);
}
