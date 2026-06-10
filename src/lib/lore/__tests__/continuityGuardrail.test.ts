/**
 * Tests for the pure continuity guardrail module (#409/#412): contract
 * building, deterministic contradiction detection, and correction prompts.
 */

import {
  buildContinuityContract,
  buildContinuityCorrectionPrompt,
  detectContinuityIssues,
  formatContinuityExpectations,
  CONTINUITY_CORRECTION_HEADER,
} from '../continuityGuardrail';
import type { LoreFact } from '@/types/lore.types';
import type { ContinuityContract } from '@/types/continuity.types';
import type { NPCRelationshipState } from '@/types/world-state.types';

const makeFact = (overrides: Partial<LoreFact> = {}): LoreFact => ({
  id: 'fact-mira',
  category: 'characters',
  key: 'world-1:character_mira',
  value: 'Mira - a wary herbalist',
  aliases: ['the herbalist'],
  source: 'narrative',
  worldId: 'world-1',
  visibility: 'world-shared',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeRelationship = (
  trust: number,
  sentiment: number
): NPCRelationshipState => ({
  trust,
  sentiment,
  lastInteraction: '2025-01-01T00:00:00.000Z',
  sessionId: 'session-1',
});

const buildMiraContract = (trust = 5, sentiment = -80): ContinuityContract =>
  buildContinuityContract({
    facts: [makeFact()],
    npcRelationships: { 'npc-mira': makeRelationship(trust, sentiment) },
    npcNames: { 'npc-mira': 'Mira' },
    recentDecisions: [{ text: 'Betray the herbalist', outcome: 'success' }],
  });

describe('buildContinuityContract', () => {
  it('joins relationships to lore aliases and derives tone from trust/sentiment', () => {
    const contract = buildMiraContract();

    expect(contract.npcs).toHaveLength(1);
    expect(contract.npcs[0]).toMatchObject({
      npcId: 'npc-mira',
      name: 'Mira',
      trust: 5,
      sentiment: -80,
      expectedTone: 'hostile',
    });
    expect(contract.npcs[0].aliases).toContain('the herbalist');
    expect(contract.recentDecisions).toEqual([
      { text: 'Betray the herbalist', outcome: 'success' },
    ]);
  });

  it('extracts canon facts for dead entities from fact descriptions', () => {
    const contract = buildContinuityContract({
      facts: [
        makeFact({
          id: 'fact-tom',
          key: 'world-1:character_old_tom',
          value: 'Old Tom - the village elder',
          aliases: [],
          metadata: { description: 'Old Tom died defending the bridge.' },
        }),
      ],
      npcRelationships: {},
      npcNames: {},
      recentDecisions: [],
    });

    expect(contract.canonFacts).toHaveLength(1);
    expect(contract.canonFacts[0]).toMatchObject({
      entity: 'Old Tom',
      status: 'dead',
    });
  });
});

describe('detectContinuityIssues', () => {
  it('flags warm prose about an NPC whose trust was tanked', () => {
    const issues = detectContinuityIssues(
      'Mira beams at you and embraces you warmly.',
      buildMiraContract()
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ type: 'relationship-tone', entity: 'Mira' });
    expect(issues[0].excerpt).toContain('embraces you warmly');
  });

  it('flags warm prose referencing the NPC only by a lore alias', () => {
    const issues = detectContinuityIssues(
      'The herbalist hugs you fondly before you leave.',
      buildMiraContract()
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].entity).toBe('Mira');
  });

  it('passes warm prose when the relationship is actually warm', () => {
    const issues = detectContinuityIssues(
      'Mira beams at you and embraces you warmly.',
      buildMiraContract(90, 60)
    );

    expect(issues).toHaveLength(0);
  });

  it('respects negation guards', () => {
    const issues = detectContinuityIssues(
      'Mira does not smile warmly at you.',
      buildMiraContract()
    );

    expect(issues).toHaveLength(0);
  });

  it('flags a dead entity written as actively present', () => {
    const contract = buildContinuityContract({
      facts: [
        makeFact({
          id: 'fact-tom',
          value: 'Old Tom - the village elder',
          aliases: [],
          metadata: { description: 'Old Tom died defending the bridge.' },
        }),
      ],
      npcRelationships: {},
      npcNames: {},
      recentDecisions: [],
    });

    expect(
      detectContinuityIssues('Old Tom greets you at the door.', contract)
    ).toMatchObject([{ type: 'reversed-fact', entity: 'Old Tom' }]);
    expect(
      detectContinuityIssues(
        'You remember how Old Tom used to greet you.',
        contract
      )
    ).toHaveLength(0);
  });

  it('returns nothing for empty content', () => {
    expect(detectContinuityIssues('', buildMiraContract())).toHaveLength(0);
  });
});

describe('formatContinuityExpectations', () => {
  it('formats NPC, canon, and decision constraints', () => {
    const block = formatContinuityExpectations(buildMiraContract());

    expect(block).toContain('CONTINUITY REQUIREMENTS');
    expect(block).toContain('Mira');
    expect(block).toContain('trust 5/100');
    expect(block).toContain('Betray the herbalist');
  });

  it('returns an empty string for an empty contract', () => {
    expect(
      formatContinuityExpectations({ npcs: [], canonFacts: [], recentDecisions: [] })
    ).toBe('');
  });
});

describe('buildContinuityCorrectionPrompt', () => {
  it('includes the header, detected issues, constraints, and original prose', () => {
    const contract = buildMiraContract();
    const content = 'Mira beams at you and embraces you warmly.';
    const issues = detectContinuityIssues(content, contract);

    const prompt = buildContinuityCorrectionPrompt(content, issues, contract);

    expect(prompt).toContain(CONTINUITY_CORRECTION_HEADER);
    expect(prompt).toContain('embraces you warmly');
    expect(prompt).toContain('CONTINUITY REQUIREMENTS');
    expect(prompt).toContain(content);
  });
});
