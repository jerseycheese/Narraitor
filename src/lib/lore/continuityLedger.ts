/**
 * Continuity Ledger
 *
 * The lore-fed half of the continuity contract: assertions the story already
 * made, commitments (promised vs delivered), and player-caused scene changes,
 * read from `LoreFact.metadata.continuity` tags the extractor writes after
 * each segment. Pure builders over fact arrays; the deterministic checks and
 * prompt formatting live in `continuityGuardrail.ts`.
 *
 * Like `loreContext.ts`, this module takes data as parameters and imports no
 * stores; store reads live in `lib/ai/narrativeGenerator.continuity.ts`.
 */

import type { LoreFact } from '../../types/lore.types';
import type {
  ContinuityAssertion,
  ContinuityCommitment,
  ContinuitySceneChange,
} from '../../types/continuity.types';

// Ledger caps bound prompt growth: the block was measured at 3 lines before the
// ledger existed and the whole prompt already runs 20-34k chars over a session.
const MAX_ASSERTIONS = 10;
const MAX_COMMITMENTS = 6;
const MAX_SCENE_CHANGES = 4;
const MIN_TOPIC_TERM_LENGTH = 4;
const MAX_TOPIC_TERMS = 3;
const MAX_REFERENCE_TERMS = 6;
const NARRATION_SPEAKER = 'narration';
/** Shortest name or alias worth matching as a whole word. */
export const MIN_TERM_LENGTH = 3;

const TOPIC_STOPWORDS = new Set([
  'the', 'this', 'that', 'with', 'from', 'about', 'their', 'there', 'what', 'when',
  'will', 'would', 'have', 'been', 'into', 'over', 'your', 'them', 'they',
]);

// The extractor tags the player's own questions as assertions spoken by "the
// protagonist"; a question is not an answer, so player-spoken lines are dropped.
const PLAYER_SPEAKER = /^(?:the )?(?:protagonist|player|you)$/i;

export function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Topic labels compare case- and punctuation-insensitively so "Mill debt" and "mill debt" line up. */
function normalizeTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^the /, '')
    .trim();
}

function factTime(fact: LoreFact): number {
  const time = new Date(fact.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/** Distinct continuity topic labels in the ledger, for the extractor's reuse hint. */
export function collectContinuityTopics(facts: LoreFact[]): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const fact of facts) {
    const topic = fact?.metadata?.continuity?.topic?.trim();
    if (!topic) continue;
    const normalized = normalizeTopic(topic);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    topics.push(topic);
  }
  return topics;
}

/** Tagged event facts in creation order; everything else in the ledger builds on this. */
export function ledgerFacts(facts: LoreFact[]): LoreFact[] {
  return facts
    .filter((fact) => fact?.category === 'events' && fact.value && fact.metadata?.continuity?.kind)
    .sort((a, b) => factTime(a) - factTime(b));
}

function mentionsPlayer(text: string, playerName?: string): boolean {
  const name = playerName?.trim();
  if (!name || name.length < MIN_TERM_LENGTH) return false;
  return new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(text);
}

function isPlayerSpeaker(speaker: string, playerName?: string): boolean {
  return PLAYER_SPEAKER.test(speaker) || mentionsPlayer(speaker, playerName);
}

/**
 * First answer per (topic, speaker) is canon. Topics asked more than once rank
 * first because a repeated question is exactly where drift shows.
 */
export function buildAssertions(ledger: LoreFact[], playerName?: string): ContinuityAssertion[] {
  const mentionsByTopic = new Map<string, number>();
  const firstByKey = new Map<string, ContinuityAssertion>();

  for (const fact of ledger) {
    const annotation = fact.metadata!.continuity!;
    if (annotation.kind !== 'assertion') continue;
    const topic = annotation.topic?.trim() || fact.value.trim();
    const topicKey = normalizeTopic(topic);
    if (!topicKey) continue;
    mentionsByTopic.set(topicKey, (mentionsByTopic.get(topicKey) ?? 0) + 1);
    if (mentionsPlayer(`${topic} ${fact.value}`, playerName)) continue;

    const speaker = annotation.speaker?.trim() || NARRATION_SPEAKER;
    if (isPlayerSpeaker(speaker, playerName)) continue;
    const key = `${topicKey}|${speaker.toLowerCase()}`;
    if (firstByKey.has(key)) continue;
    firstByKey.set(key, { topic, speaker, claim: fact.value.trim(), mentions: 0 });
  }

  return Array.from(firstByKey.values())
    .map((assertion) => ({
      ...assertion,
      mentions: mentionsByTopic.get(normalizeTopic(assertion.topic)) ?? 1,
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, MAX_ASSERTIONS);
}

const REPROMISE_LEXICON =
  /\b(?:re-?promis\w*|reassur\w*|reiterate(?:\s+your|\s+the|\s+his|\s+her|\s+their)?\s+promise|repeat(?:\s+your|\s+the|\s+his|\s+her|\s+their)?\s+promise)\b|\b(?:promis\w*|swear\w*|vow\w*|assur\w*|give\s+(?:me\s+)?your\s+word)\b[\s\S]*?\bagain\b/i;

/** Word-start match, so "document" also catches "documents". */
function termPattern(term: string): RegExp {
  return new RegExp(`\\b${escapeRegExp(term)}`, 'i');
}

/**
 * Derives isReconfirmationRequested on delivered commitments when the player's
 * action directly asks to re-promise one specific delivered commitment (#1963).
 * Ambiguous (multiple matching) or non-matching requests leave all false.
 */
export function annotateReconfirmationRequests(
  commitments: ContinuityCommitment[],
  playerActionText?: string
): ContinuityCommitment[] {
  const text = playerActionText?.trim();
  if (!text || !REPROMISE_LEXICON.test(text)) {
    return commitments;
  }

  const matchingIndices: number[] = [];
  commitments.forEach((commitment, idx) => {
    if (commitment.status !== 'delivered') return;
    const matches = commitment.terms.some((term) => termPattern(term).test(text));
    if (matches) {
      matchingIndices.push(idx);
    }
  });

  if (matchingIndices.length === 1) {
    const targetIdx = matchingIndices[0];
    return commitments.map((commitment, idx) =>
      idx === targetIdx ? { ...commitment, isReconfirmationRequested: true } : commitment
    );
  }

  return commitments;
}

/** Delivered beats promised on the same topic; the delivering fact is the statement kept. */
export function buildCommitments(
  ledger: LoreFact[],
  itemNames: string[] = [],
  playerActionText?: string
): ContinuityCommitment[] {
  const byTopic = new Map<string, ContinuityCommitment>();
  for (const fact of ledger) {
    const annotation = fact.metadata!.continuity!;
    if (annotation.kind !== 'commitment') continue;
    const topic = annotation.topic?.trim() || fact.value.trim();
    const topicKey = normalizeTopic(topic);
    if (!topicKey) continue;
    const status = annotation.status ?? 'promised';
    const existing = byTopic.get(topicKey);
    if (existing && existing.status === 'delivered') continue;
    if (existing && status === 'promised') continue;
    byTopic.set(topicKey, {
      topic,
      by: annotation.speaker?.trim() || existing?.by || NARRATION_SPEAKER,
      statement: fact.value.trim(),
      status,
      terms: referenceTerms(topic, itemNames, fact.value),
    });
  }
  const commitments = Array.from(byTopic.values()).slice(-MAX_COMMITMENTS);
  return annotateReconfirmationRequests(commitments, playerActionText);
}


/**
 * One line per changed object, latest statement wins: later turns retell the
 * same change in new words, and a reversal (the board repaired) has to replace
 * the original change rather than sit under it.
 */
export function buildSceneChanges(ledger: LoreFact[]): ContinuitySceneChange[] {
  const latestByTopic = new Map<string, ContinuitySceneChange>();
  for (const fact of ledger) {
    const annotation = fact.metadata!.continuity!;
    if (annotation.kind !== 'scene-change') continue;
    const topicKey = normalizeTopic(annotation.topic?.trim() || fact.value);
    if (!topicKey) continue;
    latestByTopic.set(topicKey, { statement: fact.value.trim() });
  }
  return Array.from(latestByTopic.values()).slice(-MAX_SCENE_CHANGES);
}

/** Words of a label worth matching on: long enough to be distinctive, not filler. */
function significantTerms(label: string): string[] {
  return normalizeTopic(label)
    .split(' ')
    .filter((term) => term.length >= MIN_TOPIC_TERM_LENGTH && !TOPIC_STOPWORDS.has(term));
}

/** Significant words of a topic label; all must appear in a sentence for a stale-promise hit. */
export function topicTerms(topic: string): string[] {
  return significantTerms(topic).slice(0, MAX_TOPIC_TERMS);
}

/**
 * Every word a sentence might use to point at this commitment: the topic's own
 * terms, plus the terms of any inventory item the commitment actually names.
 * That is what lets "You'll have a copy" land on "parcel appraisal documents".
 * The item in the player's hands is called a copy; the topic label never is.
 *
 * An item counts as named when it overlaps the topic or the delivering line.
 * A topic label and its item are often genuine synonyms sharing no word at all
 * — "mayor's letter" against a Sealed Envelope — and the prose that handed it
 * over is what ties them together. Items neither one mentions contribute
 * nothing, otherwise the whole backpack becomes a trigger word list.
 */
export function referenceTerms(
  topic: string,
  itemNames: string[] = [],
  statement = ''
): string[] {
  const terms = topicTerms(topic);
  const named = new Set([...terms, ...significantTerms(statement)]);
  for (const name of itemNames) {
    const itemTerms = significantTerms(name);
    if (!itemTerms.some((term) => named.has(term))) continue;
    for (const term of itemTerms) {
      if (!terms.includes(term)) terms.push(term);
    }
  }
  return terms.slice(0, MAX_REFERENCE_TERMS);
}
