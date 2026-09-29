import React from 'react';
import { render, screen } from '@testing-library/react';
import ActiveGameSessionNarrativeColumn from '../ActiveGameSessionNarrativeColumn';

jest.mock('@/components/Narrative/NarrativeHistoryManager', () => ({
  NarrativeHistoryManager: jest.fn(() => <div data-testid="narrative-history" />),
}));

const baseProps = {
  controllerKey: 'controller-key',
  sessionId: 'session-1',
  segmentCount: 1,
};

describe('ActiveGameSessionNarrativeColumn', () => {
  it('renders narrative history', () => {
    render(<ActiveGameSessionNarrativeColumn {...baseProps} />);

    expect(screen.getByTestId('narrative-history')).toBeInTheDocument();
  });

  it('sets the tutorial anchor on the narrative', () => {
    render(<ActiveGameSessionNarrativeColumn {...baseProps} />);

    const container = document.getElementById('narrative-container');
    expect(container).not.toBeNull();
    expect(container).toHaveAttribute('data-tutorial', 'narrative-display');
  });
});
