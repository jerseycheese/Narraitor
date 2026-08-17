/**
 * Continuity Guardrail (#409/#412)
 *
 * Pure contradiction detection for generated narrative. Builds a compact
 * "continuity contract" from established state (lore facts, NPC relationships,
 * recent decisions) and checks new prose against it deterministically, so the
 * fast path adds microseconds — an AI correction call only happens when an
 * issue is detected (per #441's sub-200ms generation-impact constraint).
 *
 * Like `loreContext.ts`, this module takes data as parameters and imports no
 * stores; store reads live in `lib/ai/narrativeGenerator.continuity.ts`.
 */

import type { LoreFact } from '../../types/lore.types';
import type { NPCRelationshipState } from '../../types/world-state.types';
import type { EntityID } from '../../types/common.types';
import type {
  ContinuityAssertion,
  ContinuityCanonFact,
  ContinuityCommitment,
  ContinuityContract,
  ContinuityIssue,
  ContinuityNpcExpectation,
  ContinuityRecentDecision,
  ContinuitySceneChange,
  ContinuityTone,
} from '../../types/continuity.types';

/** Routes correction responses in tests and marks the call in debug output. */
export const CONTINUITY_CORRECTION_HEADER = 'CONTINUITY CORRECTION';

const MAX_NPC_EXPECTATIONS = 8;
const MAX_CANON_FACTS = 10;
const MAX_RECENT_DECISIONS = 3;
// Ledger caps bound prompt growth: the block was measured at 3 lines before the
// ledger existed and the whole prompt already runs 20-34k chars over a session.
const MAX_ASSERTIONS = 10;
const MAX_COMMITMENTS = 6;
const MAX_SCENE_CHANGES = 4;
const MAX_EXCERPT_LENGTH = 240;
const MIN_TERM_LENGTH = 3;
const MIN_TOPIC_TERM_LENGTH = 4;
const MAX_TOPIC_TERMS = 3;
const NARRATION_SPEAKER = 'narration';

// Lexicons are deliberately conservative: every false positive costs an AI
// correction call, so prefer missing a soft contradiction over flagging
// ordinary prose.
const DEAD_STATUS = /\b(is dead|died|was killed|slain|deceased)\b/i;
const DESTROYED_STATUS = /\b(was destroyed|burned down|razed|no longer exists)\b/i;
const WARMTH_LEXICON =
  /\b(warmly|embrac(?:e|es|ed|ing)|beam(?:s|ed|ing)|fondly|affectionate(?:ly)?|hug(?:s|ged|ging)?|old friend|dear friend|trusts? you)\b/i;
const NEGATION_GUARD =
  /\b(not|never|no longer|coldly|icily|feigned|feigning|pretend(?:s|ed|ing)?|mockingly|sarcastically)\b|n['’]t\b/i;
const ACTIVE_PRESENCE_LEXICON =
  /\b(says?|said|speak(?:s|ing)?|spoke|asks?|asked|repl(?:y|ies|ied)|smil(?:e|es|ed|ing)|laugh(?:s|ed|ing)?|walk(?:s|ed|ing)?|arriv(?:e|es|ed|ing)|greet(?:s|ed|ing)?|stands?|stood|nods?|nodded|hands you|waves?|waved)\b/i;
const MEMORY_GUARD =
  /\b(remember(?:s|ed|ing)?|recall(?:s|ed|ing)?|memor\w+|ghost(?:s|ly)?|spirit|vision|dream(?:s|ed|t|ing)?|grave\w*|tomb|dead|died|death|haunt\w*|once|used to|echo(?:es)?|portrait|statue)\b/i;
// A fresh promise of something the ledger says was already delivered.
const PROMISE_LEXICON =
  /\b(promis(?:e|es|ing)|vow(?:s|ing)?|swear(?:s)?|pledg(?:e|es|ing)|assur(?:e|es|ing) you|guarantee(?:s|ing)?|(?:I|we)(?:'ll| will| shall) (?:make sure|see to it|get you|bring you|have|provide|send|give))\b/i;
const RECAP_GUARD =
  /\b(as (?:I |he |she |they |we )?promised|promised (?:earlier|before|you)|already|kept (?:his|her|their|my|our) (?:word|promise)|delivered|gave|handed|as agreed|in your (?:hands?|lap|possession))\b/i;
const TOPIC_STOPWORDS = new Set([
  'the', 'this', 'that', 'with', 'from', 'about', 'their', 'there', 'what', 'when',
  'will', 'would', 'have', 'been', 'into', 'over', 'your', 'them', 'they',
]);

export interface BuildContinuityContractArgs {
  facts: LoreFact[];
  npcRelationships: Record<EntityID, NPCRelationshipState>;
  /** npcId -> display name, from the NPC store roster. */
  npcNames: Record<EntityID, string>;
  recentDecisions: ContinuityRecentDecision[];
  /**
   * Player character name. Assertions naming the player are excluded from the
   * contract: an NPC inventing a fact about the player is the ledger's known
   * poison path, and the player's own facts already reach the prompt through
   * character context.
   */
  playerName?: string;
}

/**
 * Derives the tone a segment should give an NPC from relationship numbers.
 */
function toneForRelationship(trust: number, sentiment: number): ContinuityTone {
  if (sentiment <= -50) return 'hostile';
  if (trust <= 25) return 'guarded';
  if (trust >= 75 && sentiment >= 50) return 'warm';
  return 'neutral';
}

/** Leading entity name, before the first dash/colon (loreContext convention). */
function parseEntityName(value: string): string {
  const match = value.match(/^([^-:]+?)(?:\s*[-:]\s*.+)?$/);
  return (match ? match[1] : value).trim();
}

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dedupeTerms(terms: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const term of terms) {
    const trimmed = term?.trim();
    if (!trimmed || trimmed.length < MIN_TERM_LENGTH) continue;
    const lower = trimmed.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    result.push(trimmed);
  }
  return result;
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

function ledgerFacts(facts: LoreFact[]): LoreFact[] {
  return facts
    .filter((fact) => fact?.category === 'events' && fact.value && fact.metadata?.continuity?.kind)
    .sort((a, b) => factTime(a) - factTime(b));
}

function mentionsPlayer(text: string, playerName?: string): boolean {
  const name = playerName?.trim();
  if (!name || name.length < MIN_TERM_LENGTH) return false;
  return new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(text);
}

/**
 * First answer per (topic, speaker) is canon. Topics asked more than once rank
 * first because a repeated question is exactly where drift shows.
 */
function buildAssertions(ledger: LoreFact[], playerName?: string): ContinuityAssertion[] {
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

/** Delivered beats promised on the same topic; the delivering fact is the statement kept. */
function buildCommitments(ledger: LoreFact[]): ContinuityCommitment[] {
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
    });
  }
  return Array.from(byTopic.values()).slice(-MAX_COMMITMENTS);
}

function buildSceneChanges(ledger: LoreFact[]): ContinuitySceneChange[] {
  return ledger
    .filter((fact) => fact.metadata!.continuity!.kind === 'scene-change')
    .slice(-MAX_SCENE_CHANGES)
    .map((fact) => ({ statement: fact.value.trim() }));
}

export function buildContinuityContract(
  args: BuildContinuityContractArgs
): ContinuityContract {
  const { facts, npcRelationships, npcNames, recentDecisions, playerName } = args;
  const characterFacts = facts.filter((fact) => fact?.category === 'characters');

  const npcs: ContinuityNpcExpectation[] = [];
  for (const [npcId, relationship] of Object.entries(npcRelationships)) {
    const name = npcNames[npcId]?.trim();
    if (!name || !relationship) continue;

    // Lore facts carry names, not npc ids, so the only join is name equality.
    const matchingFacts = characterFacts.filter((fact) => {
      const factName = parseEntityName(fact.value).toLowerCase();
      return (
        factName === name.toLowerCase() ||
        (fact.aliases || []).some((alias) => alias.toLowerCase() === name.toLowerCase())
      );
    });
    const aliases = dedupeTerms(
      matchingFacts.flatMap((fact) => [parseEntityName(fact.value), ...(fact.aliases || [])])
    ).filter((alias) => alias.toLowerCase() !== name.toLowerCase());

    npcs.push({
      npcId,
      name,
      aliases,
      trust: relationship.trust,
      sentiment: relationship.sentiment,
      expectedTone: toneForRelationship(relationship.trust, relationship.sentiment),
    });
  }
  npcs.sort((a, b) => Math.abs(b.sentiment) - Math.abs(a.sentiment));

  const canonFacts: ContinuityCanonFact[] = [];
  for (const fact of facts) {
    if (!fact?.value || !['characters', 'locations', 'events'].includes(fact.category)) {
      continue;
    }
    const text = `${fact.value} ${fact.metadata?.description ?? ''}`;
    const status = DEAD_STATUS.test(text)
      ? 'dead'
      : DESTROYED_STATUS.test(text)
        ? 'destroyed'
        : null;
    if (!status) continue;

    canonFacts.push({
      entity: parseEntityName(fact.value),
      aliases: dedupeTerms(fact.aliases || []),
      status,
      statement: text.trim(),
    });
    if (canonFacts.length >= MAX_CANON_FACTS) break;
  }

  const ledger = ledgerFacts(facts);

  return {
    npcs: npcs.slice(0, MAX_NPC_EXPECTATIONS),
    canonFacts,
    recentDecisions: recentDecisions.slice(-MAX_RECENT_DECISIONS),
    assertions: buildAssertions(ledger, playerName),
    commitments: buildCommitments(ledger),
    sceneChanges: buildSceneChanges(ledger),
  };
}

/** True when the contract has nothing to enforce; callers treat that as "guardrail off". */
export function isContinuityContractEmpty(contract: ContinuityContract): boolean {
  return (
    contract.npcs.length === 0 &&
    contract.canonFacts.length === 0 &&
    contract.assertions.length === 0 &&
    contract.commitments.length === 0 &&
    contract.sceneChanges.length === 0
  );
}

/** Significant words of a topic label; all must appear in a sentence for a stale-promise hit. */
function topicTerms(topic: string): string[] {
  return normalizeTopic(topic)
    .split(' ')
    .filter((term) => term.length >= MIN_TOPIC_TERM_LENGTH && !TOPIC_STOPWORDS.has(term))
    .slice(0, MAX_TOPIC_TERMS);
}

function findOffendingSentence(
  sentences: string[],
  terms: string[],
  positiveLexicon: RegExp,
  guardLexicon: RegExp
): string | null {
  const termPatterns = terms.map(
    (term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i')
  );
  for (const sentence of sentences) {
    if (!positiveLexicon.test(sentence) || guardLexicon.test(sentence)) continue;
    if (termPatterns.some((pattern) => pattern.test(sentence))) {
      return sentence.trim().slice(0, MAX_EXCERPT_LENGTH);
    }
  }
  return null;
}

/**
 * Deterministic fast-path check. Returns at most one issue per NPC / canon
 * fact so a repeated contradiction doesn't flood the result.
 */
export function detectContinuityIssues(
  content: string,
  contract: ContinuityContract
): ContinuityIssue[] {
  if (!content?.trim()) return [];

  const sentences = content.split(/(?<=[.!?])\s+/);
  const issues: ContinuityIssue[] = [];

  for (const npc of contract.npcs) {
    if (npc.expectedTone !== 'hostile' && npc.expectedTone !== 'guarded') continue;
    const excerpt = findOffendingSentence(
      sentences,
      [npc.name, ...npc.aliases],
      WARMTH_LEXICON,
      NEGATION_GUARD
    );
    if (excerpt) {
      issues.push({
        type: 'relationship-tone',
        entity: npc.name,
        excerpt,
        expectation: describeNpcExpectation(npc),
      });
    }
  }

  for (const canon of contract.canonFacts) {
    const excerpt = findOffendingSentence(
      sentences,
      [canon.entity, ...canon.aliases],
      ACTIVE_PRESENCE_LEXICON,
      MEMORY_GUARD
    );
    if (excerpt) {
      issues.push({
        type: 'reversed-fact',
        entity: canon.entity,
        excerpt,
        expectation: describeCanonExpectation(canon),
      });
    }
  }

  // Assertions and scene changes are prevention-only: whether a sentence
  // contradicts "the town holds the mortgage" isn't a regex question. A fresh
  // promise of a delivered commitment is, so that one gets the fast path.
  for (const commitment of contract.commitments) {
    if (commitment.status !== 'delivered') continue;
    const terms = topicTerms(commitment.topic);
    if (terms.length === 0) continue;
    const termPatterns = terms.map((term) => new RegExp(`\\b${escapeRegExp(term)}`, 'i'));
    const sentence = sentences.find(
      (candidate) =>
        PROMISE_LEXICON.test(candidate) &&
        !RECAP_GUARD.test(candidate) &&
        termPatterns.every((pattern) => pattern.test(candidate))
    );
    if (sentence) {
      issues.push({
        type: 'stale-promise',
        entity: commitment.topic,
        excerpt: sentence.trim().slice(0, MAX_EXCERPT_LENGTH),
        expectation: describeCommitmentExpectation(commitment),
      });
    }
  }

  return issues;
}

function describeCommitmentExpectation(commitment: ContinuityCommitment): string {
  if (commitment.status === 'delivered') {
    return `${commitment.by} already delivered on "${commitment.topic}" (${commitment.statement}). The player has it; nobody promises it again — refer to it as done.`;
  }
  return `${commitment.by} promised "${commitment.topic}" (${commitment.statement}) and has not delivered yet. Do not treat it as done.`;
}

function describeNpcExpectation(npc: ContinuityNpcExpectation): string {
  const stance = npc.expectedTone === 'hostile' ? 'is hostile toward' : 'distrusts';
  return `${npc.name} currently ${stance} the player (trust ${npc.trust}/100, sentiment ${npc.sentiment}). Portray them as ${npc.expectedTone === 'hostile' ? 'hostile or cold' : 'guarded or wary'} — never warm or affectionate.`;
}

function describeCanonExpectation(canon: ContinuityCanonFact): string {
  const state = canon.status === 'dead' ? 'is dead' : 'was destroyed';
  const forbidden = canon.status === 'dead' ? 'alive or present' : 'intact or in use';
  return `${canon.entity} ${state} (${canon.statement}). Do not write ${canon.status === 'dead' ? 'them' : 'it'} as ${forbidden}.`;
}

/**
 * Compact prompt block shared by the prevention layer (appended to the
 * generation prompt) and the correction prompt. Empty string for an empty
 * contract so callers can append unconditionally.
 */
export function formatContinuityExpectations(contract: ContinuityContract): string {
  const lines: string[] = [];

  for (const npc of contract.npcs) {
    if (npc.expectedTone === 'hostile' || npc.expectedTone === 'guarded') {
      lines.push(`- ${describeNpcExpectation(npc)}`);
    } else if (npc.expectedTone === 'warm') {
      lines.push(
        `- ${npc.name} is friendly toward the player (trust ${npc.trust}/100, sentiment ${npc.sentiment}).`
      );
    }
  }
  for (const canon of contract.canonFacts) {
    lines.push(`- ${describeCanonExpectation(canon)}`);
  }
  for (const decision of contract.recentDecisions) {
    const outcome = decision.outcome ? ` (outcome: ${decision.outcome})` : '';
    lines.push(`- Recent decision: "${decision.text}"${outcome}. Honor its consequences.`);
  }

  if (contract.assertions.length > 0) {
    lines.push(
      'Answers this story already gave (if the question comes up again, the same answer stands; another character may contradict it only knowingly, never by accident):'
    );
    for (const assertion of contract.assertions) {
      lines.push(`- ${assertion.topic} (${assertion.speaker}): ${assertion.claim}`);
    }
  }
  if (contract.commitments.length > 0) {
    lines.push(
      'Promises on record (never re-promise what is DELIVERED; never treat what is OUTSTANDING as done):'
    );
    for (const commitment of contract.commitments) {
      const label = commitment.status === 'delivered' ? 'DELIVERED' : 'OUTSTANDING';
      lines.push(`- ${label}: ${commitment.topic} (${commitment.by}): ${commitment.statement}`);
    }
  }
  if (contract.sceneChanges.length > 0) {
    lines.push('Changes the player made to the scene (still true until undone on the page):');
    for (const change of contract.sceneChanges) {
      lines.push(`- ${change.statement}`);
    }
  }

  if (lines.length === 0) return '';
  return `CONTINUITY REQUIREMENTS (do not violate):\n${lines.join('\n')}`;
}

/**
 * Prompt for the single corrective AI call: minimal rewrite that honors the
 * contract while preserving the rest of the segment.
 */
export function buildContinuityCorrectionPrompt(
  content: string,
  issues: ContinuityIssue[],
  contract: ContinuityContract
): string {
  const issueLines = issues
    .map((issue) => `- [${issue.type}] ${issue.expectation}\n  Offending text: "${issue.excerpt}"`)
    .join('\n');

  return `${CONTINUITY_CORRECTION_HEADER}

The narrative segment below contradicts established story state.

Detected contradictions:
${issueLines}

${formatContinuityExpectations(contract)}

Rewrite the segment with the minimal changes needed to honor every requirement above. Preserve the plot events, point of view, tense, formatting, and approximate length. Return ONLY the corrected narrative prose — no commentary, headings, or JSON.

Original segment:
${content}`;
}
