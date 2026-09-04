/**
 * Continuity Guardrail (#409/#412)
 *
 * Pure contradiction detection for generated narrative. Builds a compact
 * "continuity contract" from established state (lore facts, NPC relationships,
 * recent decisions, and the ledger builders in `continuityLedger.ts`) and
 * checks new prose against it deterministically, so the fast path adds
 * microseconds — an AI correction call only happens when an issue is detected
 * (per #441's sub-200ms generation-impact constraint).
 *
 * Like `loreContext.ts`, this module takes data as parameters and imports no
 * stores; store reads live in `lib/ai/narrativeGenerator.continuity.ts`.
 */

import { escapeRegExp } from '@/lib/utils/formatters';
import type { LoreFact } from '../../types/lore.types';
import type { NPCRelationshipState } from '../../types/world-state.types';
import type { EntityID } from '../../types/common.types';
import type {
  ContinuityCanonFact,
  ContinuityCommitment,
  ContinuityContract,
  ContinuityIssue,
  ContinuityNpcExpectation,
  ContinuityRecentDecision,
  ContinuityTone,
  ContinuityUnrecordedExchange,
} from '../../types/continuity.types';
import {
  MIN_TERM_LENGTH,
  buildAssertions,
  buildCommitments,
  buildSceneChanges,
  ledgerFacts,
  termPattern,
  topicTerms,
} from './continuityLedger';
import {
  recountsUnrecordedExchange,
  refusesUnrecordedExchange,
} from './unrecordedExchange';

/** Routes correction responses in tests and marks the call in debug output. */
export const CONTINUITY_CORRECTION_HEADER = 'CONTINUITY CORRECTION';

const MAX_NPC_EXPECTATIONS = 8;
const MAX_CANON_FACTS = 10;
const MAX_RECENT_DECISIONS = 3;
const MAX_EXCERPT_LENGTH = 240;

// Lexicons are deliberately conservative: every false positive costs an AI
// correction call, so prefer missing a soft contradiction over flagging
// ordinary prose.
const DEAD_STATUS = /\b(is dead|died|was killed|slain|deceased)\b/i;
const DESTROYED_STATUS =
  /\b(was destroyed|burned down|razed|no longer exists)\b/i;
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
// The other shape a re-promise takes: no promise verb at all, just a future
// delivery aimed at the player ("You'll have a copy"). Second person only —
// first-person futures are already the promise lexicon's job.
const FUTURE_DELIVERY_LEXICON =
  /\byou(?:['’]ll| will| shall| ['’]re going to| are going to)\s+(?:have|get|receive|be given|be handed)\b/i;
const RECAP_GUARD =
  /\b(as (?:I |he |she |they |we )?promised|promised (?:earlier|before|you)|already|kept (?:his|her|their|my|our) (?:word|promise)|delivered|gave|handed|as agreed|in your (?:hands?|lap|possession))\b/i;
const BAIT_REFUSAL_GUARD =
  /\b(?:cannot|can['’]t|won['’]t|will not|refus\w*|make no (?:such )?promise|no (?:need|more|other) promise|nothing to promise|not going to promise|already (?:have|given|received|delivered|handed|settled))\b|n['’]t\s+(?:make|give|promise)\b/i;
const BAIT_ASSENT_LEXICON =
  /\b(?:(?:you\s+have\s+)?my\s+word|my\s+promise|of\s+course|as\s+you\s+wish|rest\s+assured|certainly|absolutely|it\s+will\s+be\s+done|(?:I|we)\s+will\s+see\s+to\s+it)\b|\b(?:I\s+promise|I\s+swear|I\s+vow)\b(?!\s+(?:to\s+[a-z]+|that\s+[a-z]+|\w+\s+(?:will|shall|can|must)))/i;

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
  /**
   * Names of items the player is carrying. A delivered commitment borrows the
   * names of the items that match it, so prose can refer to the thing the way
   * the player's inventory does rather than the way the topic label does.
   */
  inventoryItemNames?: string[];
  /**
   * IDs of items currently held in the character's inventory.
   * Used to check if possession-bound commitments are currently settled.
   */
  inventoryItemIds?: EntityID[];
  /**
   * Prior exchanges the player's action claims but the session never narrated
   * (#1857). Passed through rather than derived here: co-presence lives on the
   * narrative store, and this module stays store-free. Optional so the existing
   * fixtures keep compiling.
   */
  unrecordedExchanges?: ContinuityUnrecordedExchange[];
  /**
   * The player's typed action text for this turn, if any.
   * Used to derive isReconfirmationRequested on delivered commitments.
   */
  playerActionText?: string;
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

export function buildContinuityContract(
  args: BuildContinuityContractArgs
): ContinuityContract {
  const {
    facts,
    npcRelationships,
    npcNames,
    recentDecisions,
    playerName,
    inventoryItemNames,
    unrecordedExchanges,
    playerActionText,
  } = args;
  const characterFacts = facts.filter(
    (fact) => fact?.category === 'characters'
  );

  const npcs: ContinuityNpcExpectation[] = [];
  for (const [npcId, relationship] of Object.entries(npcRelationships)) {
    const name = npcNames[npcId]?.trim();
    if (!name || !relationship) continue;

    // Lore facts carry names, not npc ids, so the only join is name equality.
    const matchingFacts = characterFacts.filter((fact) => {
      const factName = parseEntityName(fact.value).toLowerCase();
      return (
        factName === name.toLowerCase() ||
        (fact.aliases || []).some(
          (alias) => alias.toLowerCase() === name.toLowerCase()
        )
      );
    });
    const aliases = dedupeTerms(
      matchingFacts.flatMap((fact) => [
        parseEntityName(fact.value),
        ...(fact.aliases || []),
      ])
    ).filter((alias) => alias.toLowerCase() !== name.toLowerCase());

    npcs.push({
      npcId,
      name,
      aliases,
      trust: relationship.trust,
      sentiment: relationship.sentiment,
      expectedTone: toneForRelationship(
        relationship.trust,
        relationship.sentiment
      ),
    });
  }
  npcs.sort((a, b) => Math.abs(b.sentiment) - Math.abs(a.sentiment));

  const canonFacts: ContinuityCanonFact[] = [];
  for (const fact of facts) {
    if (
      !fact?.value ||
      !['characters', 'locations', 'events'].includes(fact.category)
    ) {
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
    commitments: buildCommitments(
      ledger,
      inventoryItemNames,
      playerActionText,
      args.inventoryItemIds
    ),
    sceneChanges: buildSceneChanges(ledger),
    unrecordedExchanges: unrecordedExchanges ?? [],
  };
}

/** True when the contract has nothing to enforce; callers treat that as "guardrail off". */
export function isContinuityContractEmpty(
  contract: ContinuityContract
): boolean {
  return (
    contract.npcs.length === 0 &&
    contract.canonFacts.length === 0 &&
    contract.assertions.length === 0 &&
    contract.commitments.length === 0 &&
    contract.sceneChanges.length === 0 &&
    contract.unrecordedExchanges.length === 0
  );
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
    if (!positiveLexicon.test(sentence) || guardLexicon.test(sentence))
      continue;
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
    if (npc.expectedTone !== 'hostile' && npc.expectedTone !== 'guarded')
      continue;
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
    if (commitment.status !== 'delivered' || !commitment.isCurrentlySettled)
      continue;
    const terms = topicTerms(commitment.topic);
    if (terms.length === 0) continue;
    const termPatterns = terms.map(termPattern);
    // Only the words the topic label doesn't already use. A topic word on its own
    // is far too common in ordinary prose to carry a correction by itself.
    const aliasPatterns = commitment.terms
      .filter((term) => !terms.includes(term))
      .map(termPattern);

    const sentence = sentences.find((candidate) => {
      if (RECAP_GUARD.test(candidate)) return false;
      // Named outright: a promise verb plus every word of the topic.
      if (
        PROMISE_LEXICON.test(candidate) &&
        termPatterns.every((pattern) => pattern.test(candidate))
      ) {
        return true;
      }
      // Named obliquely: a future delivery to the player, plus either a name only
      // the delivered item goes by or the whole topic spelled out. Anything looser
      // fires on prose that merely reuses a topic word for something else.
      if (
        FUTURE_DELIVERY_LEXICON.test(candidate) &&
        (aliasPatterns.some((pattern) => pattern.test(candidate)) ||
          termPatterns.every((pattern) => pattern.test(candidate)))
      ) {
        return true;
      }
      // When this specific delivered commitment was directly baited by the player
      // action on this turn, flag bare assent or oblique future delivery.
      if (commitment.isReconfirmationRequested) {
        if (BAIT_REFUSAL_GUARD.test(candidate)) return false;
        if (FUTURE_DELIVERY_LEXICON.test(candidate)) return true;
        if (BAIT_ASSENT_LEXICON.test(candidate)) return true;
      }
      return false;
    });
    if (sentence) {
      issues.push({
        type: 'stale-promise',
        entity: commitment.topic,
        excerpt: sentence.trim().slice(0, MAX_EXCERPT_LENGTH),
        expectation: describeCommitmentExpectation(commitment),
      });
    }
  }

  // The NPC does not have to be named in the offending sentence. An entry here
  // exists only because the player's typed action named this NPC on this turn,
  // so the segment is that claim's answer and recounting anywhere in it is the
  // invention. Denial is what the change wants, and it is guarded.
  for (const exchange of contract.unrecordedExchanges) {
    const sentence = sentences.find((candidate, index) => {
      if (!recountsUnrecordedExchange(candidate)) return false;

      // An NPC may echo the player's question and deny it immediately after.
      // Only a direct exchange refusal in the following two sentences guards
      // that echo; unrelated negation elsewhere must not hide a recount.
      const response = sentences.slice(index + 1, index + 3).join(' ');
      return !refusesUnrecordedExchange(response);
    });
    if (sentence) {
      issues.push({
        type: 'invented-exchange',
        entity: exchange.name,
        excerpt: sentence.trim().slice(0, MAX_EXCERPT_LENGTH),
        expectation: describeUnrecordedExchange(exchange),
      });
    }
  }

  return issues;
}

/**
 * The assertable fact behind the void. Shared by the prompt block and the
 * correction prompt so the model reads the same sentence either way.
 */
export function describeUnrecordedExchange(
  exchange: ContinuityUnrecordedExchange
): string {
  const premise = `The player's action refers to a private conversation with ${exchange.name} ("${exchange.claim}") that this story never told.`;
  const record =
    exchange.scenes === 0
      ? `${exchange.name} has not shared a single narrated scene with the protagonist.`
      : exchange.aloneTogether
        ? `No narrated scene records ${exchange.name} speaking privately with the protagonist.`
        : `${exchange.name} has shared ${exchange.scenes} narrated ${exchange.scenes === 1 ? 'scene' : 'scenes'} with the protagonist and has never been alone with them.`;
  return `${premise} ${record} Do not write the conversation as if it happened, and do not have ${exchange.name} recount, confirm, or repeat it. Play the false premise: ${exchange.name} says no such conversation took place, or is confused by the question.`;
}

function describeCommitmentExpectation(
  commitment: ContinuityCommitment
): string {
  if (commitment.status === 'delivered') {
    return `${commitment.by} already delivered on "${commitment.topic}" (${commitment.statement}). The player has it; nobody promises it again — refer to it as done.`;
  }
  return `${commitment.by} promised "${commitment.topic}" (${commitment.statement}) and has not delivered yet. Do not treat it as done.`;
}

function describeNpcExpectation(npc: ContinuityNpcExpectation): string {
  const stance =
    npc.expectedTone === 'hostile' ? 'is hostile toward' : 'distrusts';
  return `${npc.name} currently ${stance} the player (trust ${npc.trust}/100, sentiment ${npc.sentiment}). Portray them as ${npc.expectedTone === 'hostile' ? 'hostile or cold' : 'guarded or wary'} — never warm or affectionate.`;
}

function describeCanonExpectation(canon: ContinuityCanonFact): string {
  const state = canon.status === 'dead' ? 'is dead' : 'was destroyed';
  const forbidden =
    canon.status === 'dead' ? 'alive or present' : 'intact or in use';
  return `${canon.entity} ${state} (${canon.statement}). Do not write ${canon.status === 'dead' ? 'them' : 'it'} as ${forbidden}.`;
}

/**
 * Compact prompt block shared by the prevention layer (appended to the
 * generation prompt) and the correction prompt. Empty string for an empty
 * contract so callers can append unconditionally.
 */
export function formatContinuityExpectations(
  contract: ContinuityContract
): string {
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
    lines.push(
      `- Recent decision: "${decision.text}"${outcome}. Honor its consequences.`
    );
  }

  if (contract.assertions.length > 0) {
    lines.push(
      'Answers this story already gave (if the question comes up again, the same answer stands; another character may contradict it only knowingly, never by accident):'
    );
    for (const assertion of contract.assertions) {
      lines.push(
        `- ${assertion.topic} (${assertion.speaker}): ${assertion.claim}`
      );
    }
  }
  if (contract.commitments.length > 0) {
    lines.push(
      'Promises on record (never re-promise what is DELIVERED; never treat what is OUTSTANDING as done):'
    );
    for (const commitment of contract.commitments) {
      if (commitment.status === 'delivered') {
        if (commitment.isCurrentlySettled) {
          lines.push(
            `- DELIVERED: ${commitment.topic} (${commitment.by}): ${commitment.statement}`
          );
        } else if (commitment.fulfillment?.kind === 'possession') {
          lines.push(
            `- PREVIOUSLY DELIVERED (replacement-eligible): ${commitment.topic} (${commitment.by}): ${commitment.statement}`
          );
        } else {
          lines.push(
            `- PREVIOUSLY DELIVERED: ${commitment.topic} (${commitment.by}): ${commitment.statement}`
          );
        }
      } else {
        lines.push(
          `- OUTSTANDING: ${commitment.topic} (${commitment.by}): ${commitment.statement}`
        );
      }
    }
  }
  if (contract.sceneChanges.length > 0) {
    lines.push(
      'Changes the player made to the scene (still true until undone on the page):'
    );
    for (const change of contract.sceneChanges) {
      lines.push(`- ${change.statement}`);
    }
  }
  if (contract.unrecordedExchanges.length > 0) {
    lines.push(
      'Conversations the player refers to that never happened on the page:'
    );
    for (const exchange of contract.unrecordedExchanges) {
      lines.push(`- ${describeUnrecordedExchange(exchange)}`);
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
    .map(
      (issue) =>
        `- [${issue.type}] ${issue.expectation}\n  Offending text: "${issue.excerpt}"`
    )
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
