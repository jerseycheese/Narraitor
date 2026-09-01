// src/lib/promptTemplates/templates/__tests__/endingTemplates.openThreads.test.ts

import { prepareEndingTemplateVariables } from '../endingTemplates';
import { endingOpenThreadsBlock } from '../endingOpenThreadsBlock';
import type { WorldClockPromptContext } from '@/types/worldThread.types';

describe('endingOpenThreadsBlock', () => {
  const mockWorldClock: WorldClockPromptContext = {
    currentTurn: 30,
    turnsSinceWorldMoved: 4,
    threads: [
      {
        kind: 'actor',
        summary: 'A companion dragged off into the woods',
        ageTurns: 23,
        overdue: true,
        overdueByTurns: 3,
        dueNow: true,
        fired: false,
        strikes: 0,
      },
      {
        kind: 'deadline',
        summary: 'A camp kid on a dawn deadline',
        ageTurns: 22,
        overdue: false,
        overdueByTurns: 0,
        dueNow: false,
        fired: false,
        strikes: 0,
      },
    ],
  };

  it('returns empty string when worldClock is undefined', () => {
    expect(endingOpenThreadsBlock(undefined)).toBe('');
  });

  it('returns empty string when threads list is empty', () => {
    expect(
      endingOpenThreadsBlock({
        currentTurn: 30,
        turnsSinceWorldMoved: 0,
        threads: [],
      })
    ).toBe('');
  });

  it('renders open threads with kind, age, overdue marker, and rules', () => {
    const rendered = endingOpenThreadsBlock(mockWorldClock);

    expect(rendered).toContain('A companion dragged off into the woods');
    expect(rendered).toContain('A camp kid on a dawn deadline');
    expect(rendered).toContain('off-screen actor');
    expect(rendered).toContain('deadline');
    expect(rendered).toContain('open 23 turns');
    expect(rendered).toContain('[OVERDUE');
    expect(rendered).toContain('RULES FOR OPEN THREADS:');
  });
});

describe('endingTemplates - openThreads integration', () => {
  const mockWorld = { name: 'Camp Moonlit', description: 'A summer camp' };
  const mockCharacter = { name: 'Taylor' };
  const mockWorldClock: WorldClockPromptContext = {
    currentTurn: 30,
    turnsSinceWorldMoved: 2,
    threads: [
      {
        kind: 'actor',
        summary: 'Captured scout held in the watchtower',
        ageTurns: 10,
        overdue: true,
        overdueByTurns: 2,
        dueNow: false,
        fired: false,
        strikes: 0,
      },
    ],
  };

  it('defaults openThreads variable to empty string when worldClock is absent', () => {
    const vars = prepareEndingTemplateVariables(
      mockWorld,
      mockCharacter,
      'story-complete',
      ['Segment 1'],
      ['Moment 1']
    );

    expect(vars.openThreads).toBe('');
  });

  it('populates openThreads variable when worldClock is provided', () => {
    const vars = prepareEndingTemplateVariables(
      mockWorld,
      mockCharacter,
      'story-complete',
      ['Segment 1'],
      ['Moment 1'],
      undefined,
      undefined,
      mockWorldClock
    );

    expect(vars.openThreads).toContain('Captured scout held in the watchtower');
  });
});
