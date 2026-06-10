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
  ContinuityCanonFact,
  ContinuityContract,
  ContinuityIssue,
  ContinuityNpcExpectation,
  ContinuityRecentDecision,
  ContinuityTone,
} from '../../types/continuity.types';

/** Routes correction responses in tests and marks the call in debug output. */
export const CONTINUITY_CORRECTION_HEADER = 'CONTINUITY CORRECTION';

const MAX_NPC_EXPECTATIONS = 8;
const MAX_CANON_FACTS = 10;
const MAX_RECENT_DECISIONS = 3;
const MAX_EXCERPT_LENGTH = 240;
const MIN_TERM_LENGTH = 3;

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

export interface BuildContinuityContractArgs {
  facts: LoreFact[];
  npcRelationships: Record<EntityID, NPCRelationshipState>;
  /** npcId -> display name, from the NPC store roster. */
  npcNames: Record<EntityID, string>;
  recentDecisions: ContinuityRecentDecision[];
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

export function buildContinuityContract(
  args: BuildContinuityContractArgs
): ContinuityContract {
  const { facts, npcRelationships, npcNames, recentDecisions } = args;
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

  return {
    npcs: npcs.slice(0, MAX_NPC_EXPECTATIONS),
    canonFacts,
    recentDecisions: recentDecisions.slice(-MAX_RECENT_DECISIONS),
  };
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

  return issues;
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
