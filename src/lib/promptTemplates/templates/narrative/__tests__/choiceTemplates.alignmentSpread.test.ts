// Guards the parts of the aligned choice template that exist to stop the
// alignment signature collapsing to one fixed tag order per turn. These are
// template assertions: they prove the instructions and the output contract are
// present, NOT that the model obeys them. Only an instrumented run can show
// that.

import { alignedChoiceTemplate } from '../choiceTypeTemplates';
import type { NarrativeContext, NarrativeSegment } from '@/types/narrative.types';

const segment: NarrativeSegment = {
  id: 'segment-1',
  worldId: 'world-1',
  sessionId: 'session-1',
  content: 'The dock plank creaks underfoot.',
  type: 'scene',
  metadata: { tags: [] },
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const narrativeContext: NarrativeContext = {
  worldId: 'world-1',
  currentSceneId: 'scene-1',
  characterIds: ['char-1'],
  previousSegments: [segment],
  recentSegments: [segment],
  currentTags: [],
  sessionId: 'session-1',
  currentSituation: 'Facing the developer across the table',
};

const baseContext = {
  worldName: 'Harrowgate Mills',
  genre: 'small-town mystery',
  narrativeContext,
};

/** Order the three tags appear in, first mention only, across a section. */
const tagOrderIn = (section: string): string[] => {
  const order: string[] = [];
  for (const match of section.matchAll(/\b(LAWFUL|NEUTRAL|CHAOTIC)\b/g)) {
    if (!order.includes(match[1])) order.push(match[1]);
  }
  return order;
};

/**
 * Anchors on line starts. The glossary header itself mentions the section that
 * follows it, so a bare indexOf for the end marker lands inside the header and
 * yields an empty slice that makes every assertion pass for free.
 */
const sectionBetween = (prompt: string, start: string, end: string): string => {
  const from = prompt.indexOf(`\n${start}`);
  const to = prompt.indexOf(`\n${end}`, from + 1);
  return prompt.slice(from, to === -1 ? undefined : to);
};

describe('aligned choice template: alignment spread instructions', () => {
  it('makes the model commit to a mix before it writes any option', () => {
    const prompt = alignedChoiceTemplate(baseContext);

    expect(prompt).toContain('Alignment Mix:');
    // The commitment has to come before the options scaffold to be a
    // commitment at all rather than a description of what was already written.
    expect(prompt.indexOf('Alignment Mix:')).toBeLessThan(prompt.indexOf('Options:'));
  });

  it('does not hand the model a canonical lawful-neutral-chaotic running order', () => {
    const prompt = alignedChoiceTemplate(baseContext);
    const glossary = sectionBetween(prompt, 'ALIGNMENT DEFINITIONS', 'CHOOSING THE MIX');

    expect(tagOrderIn(glossary)).toHaveLength(3);
    expect(tagOrderIn(glossary)).not.toEqual(['LAWFUL', 'NEUTRAL', 'CHAOTIC']);
  });

  it('does not leave CHAOTIC sitting last in the glossary', () => {
    // Last in an ordered glossary is the slot-3 tell the transcript exposed, so
    // reordering that leaves CHAOTIC at the end just renames the pattern.
    const prompt = alignedChoiceTemplate(baseContext);
    const glossary = sectionBetween(prompt, 'ALIGNMENT DEFINITIONS', 'CHOOSING THE MIX');
    const order = tagOrderIn(glossary);

    expect(order).toHaveLength(3);
    expect(order[order.length - 1]).not.toBe('CHAOTIC');
  });

  it('keeps the shared-tag guidance valid when more than three options are asked for', () => {
    const prompt = alignedChoiceTemplate({ ...baseContext, optionCount: 5 });

    expect(prompt).toContain('create 5 distinct action choices');
    expect(prompt).not.toMatch(/all three may/i);
  });

  it('says the glossary order is not a running order', () => {
    const prompt = alignedChoiceTemplate(baseContext);

    expect(prompt).toMatch(/not a running order/i);
  });

  it('permits two or three options to share a tag', () => {
    const prompt = alignedChoiceTemplate(baseContext);

    expect(prompt).toMatch(/two options may share a tag, and so may all of them/i);
  });

  it('forbids parking the disruptive option in the last slot', () => {
    const prompt = alignedChoiceTemplate(baseContext);

    expect(prompt).toMatch(/last slot/i);
  });

  it('rules out the obviously-wrong reckless option that nobody picks', () => {
    const prompt = alignedChoiceTemplate(baseContext);

    expect(prompt).toMatch(/a bold player would actually consider/i);
  });

  it('keeps the no-quota rule that #1827 established', () => {
    const prompt = alignedChoiceTemplate(baseContext);

    expect(prompt).toMatch(/there is no quota/i);
  });
});
