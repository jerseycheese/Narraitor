import { buildDecisionHistory } from '../decisionHistory';
import type { Decision, DecisionOption, NarrativeSegment } from '@/types/narrative.types';

const buildSegment = (overrides: Partial<NarrativeSegment>): NarrativeSegment => ({
  id: 'segment-1',
  content: 'Outcome',
  type: 'scene',
  metadata: { tags: [], ...overrides.metadata },
  timestamp: new Date('2025-01-01T12:00:00Z'),
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
  ...overrides,
});

const buildDecision = (overrides: Partial<Decision>): Decision => ({
  id: 'decision-1',
  prompt: 'Choose a path.',
  options: [
    { id: 'option-1', text: 'Go left' },
    { id: 'option-2', text: 'Go right' },
  ] as DecisionOption[],
  ...overrides,
});

describe('buildDecisionHistory', () => {
  it('maps selected decisions to the first outcome segment', () => {
    const decisions = [
      buildDecision({
        id: 'decision-1',
        selectedOptionId: 'option-1',
        selectedAt: new Date('2025-01-01T11:59:00Z'),
      }),
      buildDecision({
        id: 'decision-2',
        prompt: 'Choose again.',
        options: [{ id: 'option-3', text: 'Wait' }],
      }),
    ];

    const segments = [
      buildSegment({
        id: 'segment-2',
        content: 'Later fallout.',
        metadata: { tags: [], causedByDecisionId: 'decision-1' },
        createdAt: '2025-01-01T12:05:00Z',
        updatedAt: '2025-01-01T12:05:00Z',
      }),
      buildSegment({
        id: 'segment-1',
        content: 'Immediate result.',
        metadata: { tags: [], causedByDecisionId: 'decision-1' },
        createdAt: '2025-01-01T12:00:00Z',
        updatedAt: '2025-01-01T12:00:00Z',
      }),
    ];

    const result = buildDecisionHistory({ decisions, segments });

    expect(result).toHaveLength(1);
    expect(result[0].decision.id).toBe('decision-1');
    expect(result[0].outcomeSegment?.id).toBe('segment-1');
  });

  it('preserves the decision ordering provided', () => {
    const decisions = [
      buildDecision({
        id: 'decision-1',
        selectedOptionId: 'option-1',
      }),
      buildDecision({
        id: 'decision-2',
        selectedOptionId: 'option-2',
        prompt: 'Second decision',
      }),
    ];

    const segments = [
      buildSegment({
        id: 'segment-1',
        metadata: { tags: [], causedByDecisionId: 'decision-2' },
      }),
    ];

    const result = buildDecisionHistory({ decisions, segments });

    expect(result.map(entry => entry.decision.id)).toEqual(['decision-1', 'decision-2']);
  });
});
