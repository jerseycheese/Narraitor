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
import { collectContinuityTopics } from '../continuityLedger';
import type { EntityID } from '@/types/common.types';
import type { LoreFact } from '@/types/lore.types';
import type {
  ContinuityContract,
  ContinuityUnrecordedExchange,
} from '@/types/continuity.types';
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
      formatContinuityExpectations({
        npcs: [],
        canonFacts: [],
        recentDecisions: [],
        assertions: [],
        commitments: [],
        sceneChanges: [],
        unrecordedExchanges: [],
      })
    ).toBe('');
  });
});

// The ledger half of the contract: assertions, commitments and scene changes
// come from event facts the lore extractor tagged with metadata.continuity.
const makeEvent = (
  id: string,
  value: string,
  continuity: NonNullable<LoreFact['metadata']>['continuity'],
  createdAt = '2025-01-01T00:00:00.000Z'
): LoreFact =>
  makeFact({
    id,
    category: 'events',
    key: `world-1:event_${id}`,
    value,
    aliases: [],
    createdAt,
    metadata: { importance: 'high', continuity },
  });

const buildLedgerContract = (
  facts: LoreFact[],
  playerName?: string,
  inventoryItemNames?: string[],
  unrecordedExchanges?: ContinuityUnrecordedExchange[],
  playerActionText?: string,
  inventoryItemIds?: EntityID[]
) =>
  buildContinuityContract({
    facts,
    npcRelationships: {},
    npcNames: {},
    recentDecisions: [],
    playerName,
    inventoryItemNames,
    inventoryItemIds,
    unrecordedExchanges,
    playerActionText,
  });

describe('ledger-fed contract', () => {
  it('keeps the first answer per topic and speaker and counts repeats', () => {
    const contract = buildLedgerContract([
      makeEvent('e1', 'Aunt Carol says Old Man Rowan paid off the mortgage years ago.',
        { kind: 'assertion', topic: 'Mill debt', speaker: 'Aunt Carol' }, '2025-01-01T00:00:00.000Z'),
      makeEvent('e2', 'Aunt Carol says the town holds the mortgage, paid off in 2017.',
        { kind: 'assertion', topic: 'mill debt', speaker: 'Aunt Carol' }, '2025-01-01T00:10:00.000Z'),
      makeEvent('e3', 'Davies says the property is unencumbered.',
        { kind: 'assertion', topic: 'mill debt', speaker: 'Councilman Davies' }, '2025-01-01T00:05:00.000Z'),
      makeEvent('e4', 'The valuation is one hundred and fifty thousand dollars.',
        { kind: 'assertion', topic: 'developer valuation' }, '2025-01-01T00:20:00.000Z'),
    ]);

    expect(contract.assertions.map((a) => [a.speaker, a.claim.slice(0, 20), a.mentions])).toEqual([
      ['Aunt Carol', 'Aunt Carol says Old ', 3],
      ['Councilman Davies', 'Davies says the prop', 3],
      ['narration', 'The valuation is one', 1],
    ]);
  });

  it('drops assertions about the player, the ledger\'s known poison path', () => {
    const contract = buildLedgerContract(
      [
        makeEvent('e1', 'Thomas says his cousin Wren Calloway works for the county planning office.',
          { kind: 'assertion', topic: 'county planning office', speaker: 'Thomas' }),
        makeEvent('e2', 'The bank held the mortgage on the mill.',
          { kind: 'assertion', topic: 'mill debt', speaker: 'Aunt Carol' }),
      ],
      'Wren Calloway'
    );

    expect(contract.assertions.map((a) => a.topic)).toEqual(['mill debt']);
  });

  it('drops assertions the player spoke, which are questions the extractor mis-tagged', () => {
    const contract = buildLedgerContract(
      [
        makeEvent('e1', 'The protagonist asks Councilman Davies for the exact offer.',
          { kind: 'assertion', topic: 'developer offer', speaker: 'protagonist' }),
        makeEvent('e2', 'Wren asks whether anyone has seen the appraisal.',
          { kind: 'assertion', topic: 'appraisal', speaker: 'Wren Calloway' }),
        makeEvent('e3', 'Davies says the offer is nine hundred and fifty thousand dollars.',
          { kind: 'assertion', topic: 'developer offer', speaker: 'Councilman Davies' }),
      ],
      'Wren Calloway'
    );

    expect(contract.assertions.map((a) => a.speaker)).toEqual(['Councilman Davies']);
  });

  it('marks a commitment delivered once any fact on its topic says so', () => {
    const contract = buildLedgerContract([
      makeEvent('e1', 'Thorn promises the appraisal documents before any vote.',
        { kind: 'commitment', topic: 'appraisal documents', speaker: 'Thorn', status: 'promised' }, '2025-01-01T00:00:00.000Z'),
      makeEvent('e2', 'Thorn hands the appraisal documents to the player.',
        { kind: 'commitment', topic: 'appraisal documents', speaker: 'Thorn', status: 'delivered', fulfillment: { kind: 'durable' } }, '2025-01-01T00:10:00.000Z'),
      makeEvent('e3', 'Caleb promises to speak at the meeting.',
        { kind: 'commitment', topic: 'Caleb speaks publicly', speaker: 'Caleb', status: 'promised' }, '2025-01-01T00:20:00.000Z'),
    ]);

    expect(contract.commitments).toEqual([
      expect.objectContaining({ topic: 'appraisal documents', by: 'Thorn', status: 'delivered', isCurrentlySettled: true }),
      expect.objectContaining({ topic: 'Caleb speaks publicly', by: 'Caleb', status: 'promised', isCurrentlySettled: false }),
    ]);
  });

  it('keeps only the most recent scene changes, the latest statement per topic', () => {
    const facts = Array.from({ length: 6 }, (_, i) =>
      makeEvent(`s${i}`, `Scene change ${i}`, { kind: 'scene-change', topic: `object ${i}` },
        `2025-01-01T00:${String(i).padStart(2, '0')}:00.000Z`)
    );
    facts.push(
      makeEvent('s5b', 'Object 5 put back the way it was', { kind: 'scene-change', topic: 'Object 5' },
        '2025-01-01T00:07:00.000Z')
    );

    const contract = buildLedgerContract(facts);

    expect(contract.sceneChanges.map((s) => s.statement)).toEqual([
      'Scene change 2',
      'Scene change 3',
      'Scene change 4',
      'Object 5 put back the way it was',
    ]);
  });

  it('renders the ledger sections in the prompt block', () => {
    const contract = buildLedgerContract([
      makeEvent('e1', 'Aunt Carol says Rowan paid off the mortgage.',
        { kind: 'assertion', topic: 'mill debt', speaker: 'Aunt Carol' }),
      makeEvent('e2', 'Thorn hands over the appraisal documents.',
        { kind: 'commitment', topic: 'appraisal documents', speaker: 'Thorn', status: 'delivered', fulfillment: { kind: 'durable' } }),
      makeEvent('e3', 'The vote schedule is torn off the notice board.',
        { kind: 'scene-change', topic: 'notice board' }),
    ]);

    const block = formatContinuityExpectations(contract);

    expect(block).toContain('CONTINUITY REQUIREMENTS');
    expect(block).toContain('mill debt');
    expect(block).toContain('Aunt Carol');
    expect(block).toContain('DELIVERED: appraisal documents');
    expect(block).toContain('torn off the notice board');
  });

  it('flags a fresh promise of something already delivered, but not a recap of it', () => {
    const contract = buildLedgerContract([
      makeEvent('e1', 'Thorn hands over the appraisal documents.',
        { kind: 'commitment', topic: 'appraisal documents', speaker: 'Thorn', status: 'delivered', fulfillment: { kind: 'durable' } }),
    ]);

    const issues = detectContinuityIssues(
      'Thorn straightens. "I promise you the appraisal documents will be made available to every council member before any vote is cast."',
      contract
    );
    expect(issues).toMatchObject([{ type: 'stale-promise', entity: 'appraisal documents' }]);

    expect(
      detectContinuityIssues('As promised, the appraisal documents sit in your lap.', contract)
    ).toHaveLength(0);
    expect(
      detectContinuityIssues('Thorn promises to look into the drainage complaint.', contract)
    ).toHaveLength(0);
  });

  it('flags a future-tense re-promise that names the delivered item by an inventory alias', () => {
    const contract = buildLedgerContract(
      [
        makeEvent('e1', 'Councilman Davies hands over the parcel appraisal.', {
          kind: 'commitment',
          topic: 'parcel appraisal documents',
          speaker: 'Councilman Davies',
          status: 'delivered',
          fulfillment: { kind: 'possession', itemId: 'doc-1' },
        }),
      ],
      undefined,
      ['Copy of the parcel appraisal'],
      undefined,
      undefined,
      ['doc-1']
    );

    expect(
      detectContinuityIssues(
        'Davies spreads his hands. "You\'ll have a copy. Before the vote, just as I said."',
        contract
      )
    ).toMatchObject([{ type: 'stale-promise', entity: 'parcel appraisal documents' }]);

    expect(
      detectContinuityIssues(
        '"You\'ll have my answer before the vote," Davies says.',
        contract
      )
    ).toHaveLength(0);
  });

  it('flags a re-promise naming an item the delivery prose named but the topic never did', () => {
    const contract = buildLedgerContract(
      [
        makeEvent('e1', 'The mayor hands you a sealed envelope.', {
          kind: 'commitment',
          topic: "mayor's letter",
          speaker: 'The mayor',
          status: 'delivered',
          fulfillment: { kind: 'possession', itemId: 'env-1' },
        }),
      ],
      undefined,
      ['Sealed Envelope', 'Rusted Lantern'],
      undefined,
      undefined,
      ['env-1']
    );

    expect(
      detectContinuityIssues(
        '"You\'ll have the envelope before dawn," the mayor says.',
        contract
      )
    ).toMatchObject([{ type: 'stale-promise', entity: "mayor's letter" }]);

    // An item the delivery prose never mentioned stays out of the trigger list.
    expect(
      detectContinuityIssues(
        '"You\'ll have the lantern before dawn," the mayor says.',
        contract
      )
    ).toHaveLength(0);
  });

  it('leaves an unrelated future event that happens to share one topic word', () => {
    const contract = buildLedgerContract(
      [
        makeEvent('e1', 'Councilman Davies hands over the parcel appraisal.', {
          kind: 'commitment',
          topic: 'parcel appraisal documents',
          speaker: 'Councilman Davies',
          status: 'delivered',
        }),
      ],
      undefined,
      ['Copy of the parcel appraisal']
    );

    expect(
      detectContinuityIssues(
        '"You\'ll have the parcel rezoned before the vote," Davies says.',
        contract
      )
    ).toHaveLength(0);
  });

  it('collects distinct topic labels for the extractor hint', () => {
    const topics = collectContinuityTopics([
      makeEvent('e1', 'a', { kind: 'assertion', topic: 'Mill debt' }),
      makeEvent('e2', 'b', { kind: 'assertion', topic: 'mill debt' }),
      makeEvent('e3', 'c', { kind: 'scene-change', topic: 'notice board' }),
      makeEvent('e4', 'd', { kind: 'scene-change' }),
    ]);

    expect(topics).toEqual(['Mill debt', 'notice board']);
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

describe('unrecorded exchange (#1857)', () => {
  const buildExchangeContract = (
    scenes: number
  ): ContinuityContract & { unrecordedExchanges: ContinuityUnrecordedExchange[] } =>
    buildContinuityContract({
      facts: [],
      npcRelationships: {},
      npcNames: {},
      recentDecisions: [],
      unrecordedExchanges: [
        {
          npcId: 'npc-davies',
          name: 'Davies',
          scenes,
          aloneTogether: false,
          claim: 'Ask Davies to repeat publicly what he told me privately.',
        },
      ],
    });

  it('renders the never-met line at zero scenes and the record at three', () => {
    expect(formatContinuityExpectations(buildExchangeContract(0))).toContain(
      'Davies has not shared a single narrated scene with the protagonist.'
    );
    expect(formatContinuityExpectations(buildExchangeContract(3))).toContain(
      'Davies has shared 3 narrated scenes with the protagonist and has never been alone with them.'
    );
  });

  it('flags prose that recounts the exchange and leaves a denial alone', () => {
    const contract = buildExchangeContract(3);

    const recounting = detectContinuityIssues(
      'Davies straightens his tie. "What I told you in the stairwell still stands," he says to the room.',
      contract
    );
    expect(recounting).toHaveLength(1);
    expect(recounting[0]).toMatchObject({
      type: 'invented-exchange',
      entity: 'Davies',
    });

    const denying = detectContinuityIssues(
      'Davies blinks at you. "We never spoke privately," he says. "I don\'t know what you think I told you."',
      contract
    );
    expect(denying).toEqual([]);
  });
});

describe('delivered-commitment bait guards (#1963)', () => {
  const buildDeliveredContract = (
    playerActionText?: string,
    extraDelivered = false
  ) => {
    const facts = [
      makeEvent(
        'e1',
        'Councilman Davies hands over the parcel appraisal documents.',
        {
          kind: 'commitment',
          topic: 'parcel appraisal documents',
          speaker: 'Councilman Davies',
          status: 'delivered',
          fulfillment: { kind: 'possession', itemId: 'doc-1' },
        }
      ),
    ];
    if (extraDelivered) {
      facts.push(
        makeEvent(
          'e2',
          'Mayor Thorn delivers the deed to the general store.',
          {
            kind: 'commitment',
            topic: 'general store deed',
            speaker: 'Mayor Thorn',
            status: 'delivered',
            fulfillment: { kind: 'possession', itemId: 'deed-1' },
          }
        )
      );
    }
    return buildContinuityContract({
      facts,
      npcRelationships: {},
      npcNames: {},
      recentDecisions: [],
      inventoryItemNames: ['Copy of the parcel appraisal'],
      inventoryItemIds: ['doc-1', 'deed-1'],
      playerActionText,
    });
  };

  it('flags bare assent on a direct re-promise bait for a delivered commitment', () => {
    const contract = buildDeliveredContract(
      'Ask Davies to promise the parcel appraisal documents again.'
    );

    expect(contract.commitments[0].isReconfirmationRequested).toBe(true);

    const issues = detectContinuityIssues(
      'Davies nods solemnly. "You have my word."',
      contract
    );
    expect(issues).toMatchObject([
      { type: 'stale-promise', entity: 'parcel appraisal documents' },
    ]);

    const simpleAssent = detectContinuityIssues(
      'Davies smiles. "Of course, I promise."',
      contract
    );
    expect(simpleAssent).toMatchObject([
      { type: 'stale-promise', entity: 'parcel appraisal documents' },
    ]);
  });

  it('flags the historical oblique "You\'ll have a copy" shape on re-promise bait', () => {
    const contract = buildDeliveredContract(
      'Demand that Davies re-promise the appraisal before the council meeting.'
    );

    expect(contract.commitments[0].isReconfirmationRequested).toBe(true);

    const issues = detectContinuityIssues(
      'Davies spreads his hands. "You\'ll have a copy. Before the vote, just as I said."',
      contract
    );
    expect(issues).toMatchObject([
      { type: 'stale-promise', entity: 'parcel appraisal documents' },
    ]);
  });

  it('leaves refusals, recaps, and unrelated new commitments clean on re-promise bait', () => {
    const contract = buildDeliveredContract(
      'Ask Davies to promise the parcel appraisal again.'
    );

    // Explicit refusal
    const refusal = detectContinuityIssues(
      'Davies frowns. "I cannot make that promise again when the papers are already settled."',
      contract
    );
    expect(refusal).toEqual([]);

    // Already-delivered recap
    const recap = detectContinuityIssues(
      'Davies gestures to the envelope. "As I promised earlier, the documents are already in your hands."',
      contract
    );
    expect(recap).toEqual([]);

    // Unrelated new promise
    const unrelatedPromise = detectContinuityIssues(
      'Davies straightens. "I promise we will audit the general fund before next month."',
      contract
    );
    expect(unrelatedPromise).toEqual([]);
  });

  it('leaves ambiguous multi-commitment requests clean with isReconfirmationRequested false', () => {
    const contract = buildDeliveredContract(
      'Ask them to promise the parcel appraisal and the general store deed again.',
      true
    );

    expect(contract.commitments.every((c) => !c.isReconfirmationRequested)).toBe(
      true
    );

    const issues = detectContinuityIssues(
      'Davies nods. "You have my word."',
      contract
    );
    // Bare assent does not fire when isReconfirmationRequested is false/unset
    expect(issues).toEqual([]);
  });

  it('leaves lost possession deliveries un-flagged on re-promise and formats as replacement-eligible', () => {
    const contract = buildContinuityContract({
      facts: [
        makeEvent(
          'e1',
          'Davies handed over the parcel appraisal documents.',
          {
            kind: 'commitment',
            topic: 'parcel appraisal documents',
            speaker: 'Councilman Davies',
            status: 'delivered',
            fulfillment: { kind: 'possession', itemId: 'doc-1' },
          }
        ),
      ],
      npcRelationships: {},
      npcNames: {},
      recentDecisions: [],
      inventoryItemNames: [],
      inventoryItemIds: [], // item is lost!
      playerActionText: 'Ask Davies to promise the parcel appraisal documents again.',
    });

    expect(contract.commitments[0].isCurrentlySettled).toBe(false);
    expect(contract.commitments[0].isReconfirmationRequested).toBeFalsy();

    // Re-promising a lost item is permitted (replacement path)
    const issues = detectContinuityIssues(
      'Davies nods solemnly. "I promise you another copy will be delivered."',
      contract
    );
    expect(issues).toEqual([]);

    // Guidance formats as replacement-eligible
    const expectations = formatContinuityExpectations(contract);
    expect(expectations).toContain(
      '- PREVIOUSLY DELIVERED (replacement-eligible): parcel appraisal documents'
    );
  });

  it('leaves legacy/unclassified deliveries un-flagged and fails open', () => {
    const contract = buildContinuityContract({
      facts: [
        makeEvent(
          'e1',
          'Davies handed over the documents.',
          {
            kind: 'commitment',
            topic: 'parcel appraisal documents',
            speaker: 'Councilman Davies',
            status: 'delivered',
            // Missing fulfillment
          }
        ),
      ],
      npcRelationships: {},
      npcNames: {},
      recentDecisions: [],
      playerActionText: 'Ask Davies to promise the parcel appraisal documents again.',
    });

    expect(contract.commitments[0].isCurrentlySettled).toBe(false);
    expect(contract.commitments[0].fulfillment).toBeUndefined();

    const issues = detectContinuityIssues(
      'Davies nods solemnly. "I promise you the parcel appraisal documents."',
      contract
    );
    expect(issues).toEqual([]);

    const expectations = formatContinuityExpectations(contract);
    expect(expectations).toContain('- PREVIOUSLY DELIVERED: parcel appraisal documents');
  });
});

