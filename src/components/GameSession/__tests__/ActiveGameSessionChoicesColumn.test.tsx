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

  it('forwards shortcutsSuspended to ChoiceSelector so its number-key hotkeys stay off behind a modal (#276)', () => {
    render(<ActiveGameSessionChoicesColumn {...baseProps} shortcutsSuspended />);

    const selectorProps = (ChoiceSelector as jest.Mock).mock.calls[0][0] as {
      shortcutsSuspended?: boolean;
    };

    expect(selectorProps.shortcutsSuspended).toBe(true);
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

  it('shows the loading skeleton instead of stale choices while the next turn generates (F48)', () => {
    const { container } = render(
      <ActiveGameSessionChoicesColumn {...baseProps} isGeneratingChoices={true} />
    );

    // The stale decision's ChoiceSelector is suppressed in favor of the skeleton.
    expect(ChoiceSelector).not.toHaveBeenCalled();
    expect(container.querySelector('.manuscript-choices-skeleton')).toBeInTheDocument();
  });

  it('shows suggested actions count when progressive disclosure is enabled', () => {
    render(
      <ActiveGameSessionChoicesColumn
        {...baseProps}
        isProgressiveDisclosureEnabled={true}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Suggested Actions' })
    ).toBeInTheDocument();
  });

  it('toggles to hide label after tapping suggested actions toggle', () => {
    render(
      <ActiveGameSessionChoicesColumn
        {...baseProps}
        isProgressiveDisclosureEnabled={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Suggested Actions' }));

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

  describe('generation error surface (#1478)', () => {
    const transientError = {
      title: 'The story paused',
      message: 'We lost the connection needed to continue your story.',
      suggestion: 'Check that you are online, then pick up where you left off.',
      retryable: true,
      retryLabel: 'Continue the story',
      severity: 'error' as const,
    };

    const terminalError = {
      title: 'The story can\'t continue',
      message: 'Your story can\'t continue until your account settings are sorted out.',
      suggestion: 'Open Settings to check your access, then return to your story.',
      retryable: false,
      retryLabel: 'Continue the story',
      severity: 'critical' as const,
    };

    it('shows the error and a Retry for a transient (retryable) failure', () => {
      const onRetryGeneration = jest.fn();
      render(
        <ActiveGameSessionChoicesColumn
          {...baseProps}
          currentDecision={null}
          generationError={transientError}
          onRetryGeneration={onRetryGeneration}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('The story paused');
      const retry = screen.getByRole('button', { name: 'Continue the story' });
      fireEvent.click(retry);
      expect(onRetryGeneration).toHaveBeenCalledTimes(1);
      // The skeleton/choices are suppressed in favor of the error surface.
      expect(ChoiceSelector).not.toHaveBeenCalled();
    });

    it('shows terminal copy without a Retry for a non-retryable failure', () => {
      render(
        <ActiveGameSessionChoicesColumn
          {...baseProps}
          currentDecision={null}
          generationError={terminalError}
          onRetryGeneration={jest.fn()}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('can\'t continue');
      expect(
        screen.queryByRole('button', { name: 'Continue the story' })
      ).toBeNull();
    });

    it('hides the error while a turn is generating so it never flashes under the spinner', () => {
      render(
        <ActiveGameSessionChoicesColumn
          {...baseProps}
          currentDecision={null}
          isGenerating={true}
          generationError={transientError}
          onRetryGeneration={jest.fn()}
        />
      );

      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
});
