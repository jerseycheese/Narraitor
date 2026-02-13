import React from 'react';
import { render, screen } from '@testing-library/react';
import ActiveGameSessionNarrativeColumn from '../ActiveGameSessionNarrativeColumn';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import type { Decision, NarrativeSegment } from '@/types/narrative.types';

jest.mock('@/components/Narrative/NarrativeController', () => ({
  NarrativeController: jest.fn(() => <div data-testid="narrative-controller" />),
}));

jest.mock('@/components/Narrative/NarrativeHistoryManager', () => ({
  NarrativeHistoryManager: jest.fn(() => <div data-testid="narrative-history" />),
}));

const baseProps = {
  controllerKey: 'controller-key',
  worldId: 'world-1',
  sessionId: 'session-1',
  characterId: 'character-1',
  decisionWeight: 'minor' as Decision['decisionWeight'],
  triggerGeneration: false,
  initialized: true,
  shouldTriggerGeneration: false,
  localSelectedChoiceId: undefined,
  selectedChoiceId: undefined,
  onNarrativeGenerated: jest.fn(),
  onChoicesGenerated: jest.fn(),
  onEndingSuggested: jest.fn(),
  narrativeMaxHeight: '400px',
  segmentCount: 1,
};

describe('ActiveGameSessionNarrativeColumn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders narrative history and controller with computed trigger state', () => {
    render(
      <ActiveGameSessionNarrativeColumn
        {...baseProps}
        initialized={false}
        triggerGeneration={false}
        shouldTriggerGeneration={false}
      />
    );

    expect(screen.getByTestId('narrative-history')).toBeInTheDocument();
    expect(screen.getByTestId('narrative-controller')).toBeInTheDocument();

    const controllerProps = (NarrativeController as jest.Mock).mock.calls[0][0] as {
      triggerGeneration: boolean;
      onNarrativeGenerated: (segment: NarrativeSegment) => void;
    };

    expect(controllerProps.triggerGeneration).toBe(true);
    expect(controllerProps.onNarrativeGenerated).toBe(baseProps.onNarrativeGenerated);
  });

  it('sets the tutorial anchor on the narrative', () => {
    render(<ActiveGameSessionNarrativeColumn {...baseProps} />);

    const container = document.getElementById('narrative-container');
    expect(container).not.toBeNull();
    expect(container).toHaveAttribute('data-tutorial', 'narrative-display');
  });
});
