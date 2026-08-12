/**
 * MVP tests for the character prompt section: what reaches the prompt from a
 * character's attributes, skills, goals, and decision history.
 */

import {
  buildCharacterPromptSection,
  inferPreferredChoiceTypes,
} from '../personalizationEngine';
import type {
  CharacterGoal,
  PlayerDecision,
} from '@/types/personalization.types';

const decision = (
  id: string,
  choiceType: PlayerDecision['choiceType']
): PlayerDecision => ({
  id,
  prompt: 'What do you do?',
  choiceText: 'Something',
  choiceType,
  timestamp: '2023-01-01T00:00:00Z',
  sessionId: 'session-1',
  worldId: 'world-1',
  context: {},
});

const goal = (
  id: string,
  description: string,
  priority: CharacterGoal['priority'],
  isActive = true
): CharacterGoal => ({
  id,
  description,
  priority,
  progress: 0,
  establishedAt: '2023-01-01',
  isActive,
});

const baseInput = {
  name: 'Skilled Rogue',
  attributes: [
    { attributeId: 'attr-dexterity', value: 9 },
    { attributeId: 'attr-intelligence', value: 7 },
    { attributeId: 'attr-strength', value: 3 },
    { attributeId: 'attr-charisma', value: 5 },
  ],
  skills: [
    { skillId: 'skill-lockpicking', level: 4 },
    { skillId: 'skill-stealth', level: 3 },
  ],
  goals: [],
  decisions: [],
};

describe('buildCharacterPromptSection', () => {
  it('names the character', () => {
    expect(buildCharacterPromptSection(baseInput)).toContain(
      'CHARACTER: Skilled Rogue'
    );
  });

  it('reports notable attributes and leaves the unremarkable ones out', () => {
    const section = buildCharacterPromptSection(baseInput);

    expect(section).toContain('attr-dexterity');
    expect(section).toContain('Exceptional');
    expect(section).toContain('attr-strength');
    expect(section).toContain('Low');
    expect(section).not.toMatch(/attr-charisma.*Moderate/);
  });

  it('handles record-style attributes as well as the array form', () => {
    const section = buildCharacterPromptSection({
      ...baseInput,
      attributes: { dexterity: 9, strength: 3 },
    });

    expect(section).toContain('dexterity');
    expect(section).toContain('Exceptional');
  });

  it('lists skills with their proficiency', () => {
    const section = buildCharacterPromptSection(baseInput);

    expect(section).toContain('SKILLS:');
    expect(section).toContain('skill-lockpicking');
    expect(section).toMatch(/Expert|Master|Competent/);
  });

  it('accepts skills keyed by name instead of id', () => {
    const section = buildCharacterPromptSection({
      ...baseInput,
      skills: [{ name: 'Lockpicking', level: 4 }],
    });

    expect(section).toContain('Lockpicking');
  });

  it('lists active goals and skips the ones already put down', () => {
    const section = buildCharacterPromptSection({
      ...baseInput,
      goals: [
        goal('g1', 'Steal the Crown Jewels', 'primary'),
        goal('g2', 'Pay off the guild debt', 'secondary', false),
      ],
    });

    expect(section).toContain('ACTIVE GOALS:');
    expect(section).toContain('• Steal the Crown Jewels (primary)');
    expect(section).not.toContain('Pay off the guild debt');
  });

  it('names the play style the player actually leans on', () => {
    const section = buildCharacterPromptSection({
      ...baseInput,
      decisions: [
        decision('d1', 'stealthy'),
        decision('d2', 'stealthy'),
        decision('d3', 'diplomatic'),
      ],
    });

    expect(section).toContain('PREFERRED PLAY STYLE: stealthy, diplomatic');
  });

  it('keeps sections in a stable order', () => {
    const section = buildCharacterPromptSection({
      ...baseInput,
      goals: [goal('g1', 'Steal the Crown Jewels', 'primary')],
      decisions: [decision('d1', 'stealthy')],
    });

    const order = ['CHARACTER:', 'ATTRIBUTES:', 'SKILLS:', 'ACTIVE GOALS:', 'PREFERRED PLAY STYLE:'];
    const positions = order.map((heading) => section.indexOf(heading));

    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions.every((position) => position >= 0)).toBe(true);
  });

  it('omits every optional section for a bare character', () => {
    const section = buildCharacterPromptSection({
      name: 'Nobody',
      goals: [],
      decisions: [],
    });

    expect(section).toBe('CHARACTER: Nobody');
  });

  it('strips markup out of a character name before it reaches the prompt', () => {
    const section = buildCharacterPromptSection({
      ...baseInput,
      name: '<script>alert("xss")</script>Rogue',
    });

    expect(section).not.toContain('<script>');
    expect(section).toContain('CHARACTER:');
  });
});

describe('inferPreferredChoiceTypes', () => {
  it('orders choice types by how often the player picks them', () => {
    expect(
      inferPreferredChoiceTypes([
        decision('d1', 'aggressive'),
        decision('d2', 'stealthy'),
        decision('d3', 'stealthy'),
      ])
    ).toEqual(['stealthy', 'aggressive']);
  });

  it('infers nothing from a malformed decision list', () => {
    const malformed = [{ id: 'd1' }] as unknown as PlayerDecision[];

    expect(inferPreferredChoiceTypes(malformed)).toEqual([]);
  });
});
