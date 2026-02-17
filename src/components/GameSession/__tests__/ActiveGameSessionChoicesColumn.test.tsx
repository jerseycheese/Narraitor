import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ActiveGameSessionChoicesColumn from '../ActiveGameSessionChoicesColumn';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import type { Decision } from '@/types/narrative.types';

jest.mock('@/components/shared/ChoiceSelector', () => ({
  ChoiceSelector: jest.fn(() => <div data-testid="choice-selector" />),
}));

const baseDecision: Decision = {
  id: 'decision-1',
  prompt: 'What will you do?',
  options: [
    { id: 'option-1', text: 'Take the path' },
  ],
  decisionWeight: 'minor',
};

const baseProps = {
  currentDecision: baseDecision,
  segmentCount: 1,
  status: 'active' as const,
  isGenerating: false,
  isGeneratingChoices: false,
  isSessionEnded: false,
  worldSkills: [],
  characterSkills: [],
  inventoryItems: [],
  onChoiceSelected: jest.fn(),
  onCustomSubmit: jest.fn(),
  onSuggestedActionsToggle: jest.fn(),
};

describe('ActiveGameSessionChoicesColumn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ChoiceSelector when a decision is available', () => {
    render(<ActiveGameSessionChoicesColumn {...baseProps} />);

    expect(screen.getByTestId('choice-selector')).toBeInTheDocument();

    const selectorProps = (ChoiceSelector as jest.Mock).mock.calls[0][0] as {
      decision: Decision;
      isDisabled: boolean;
    };

    expect(selectorProps.decision).toEqual(baseDecision);
    expect(selectorProps.isDisabled).toBe(false);
  });

  it('does not render ChoiceSelector when no decision is available', () => {
    render(
      <ActiveGameSessionChoicesColumn
        {...baseProps}
        currentDecision={null}
        segmentCount={0}
      />
    );

    expect(screen.queryByTestId('choice-selector')).toBeNull();
    expect(ChoiceSelector).not.toHaveBeenCalled();
  });

  it('sets the tutorial anchor on the choices', () => {
    const { container } = render(<ActiveGameSessionChoicesColumn {...baseProps} />);
    const choicesContainer = container.querySelector('[data-tutorial="player-choices"]');
    expect(choicesContainer).toBeInTheDocument();
  });

  it('sets aria-busy when isGeneratingChoices is true', () => {
    const { container } = render(<ActiveGameSessionChoicesColumn {...baseProps} isGeneratingChoices={true} />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('aria-busy', 'true');
  });

  it('shows suggested actions count when progressive disclosure is enabled', () => {
    render(
      <ActiveGameSessionChoicesColumn
        {...baseProps}
        isProgressiveDisclosureEnabled={true}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Suggested Actions (1)' })
    ).toBeInTheDocument();
  });

  it('toggles to hide label after tapping suggested actions toggle', () => {
    render(
      <ActiveGameSessionChoicesColumn
        {...baseProps}
        isProgressiveDisclosureEnabled={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Suggested Actions (1)' }));

    expect(
      screen.getByRole('button', { name: 'Hide Suggested Actions' })
    ).toBeInTheDocument();
  });

  it('passes end story action to desktop input actions when progressive disclosure is enabled', () => {
    render(
      <ActiveGameSessionChoicesColumn
        {...baseProps}
        isProgressiveDisclosureEnabled={true}
        endStoryAction={<button type="button">End Story</button>}
      />
    );

    const selectorProps = (ChoiceSelector as jest.Mock).mock.calls[0][0] as {
      inputActions?: React.ReactNode;
    };

    expect(selectorProps.inputActions).toBeTruthy();
  });
});
