import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { TutorialProvider, useTutorial } from '@/components/TutorialProvider';
import { CharacterCreationWizard } from '../CharacterCreationWizard';
import { useSessionStore } from '@/state/sessionStore';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock auto save to avoid recovery dialog surfacing
jest.mock('@/hooks/useCharacterCreationAutoSave', () => ({
  useCharacterCreationAutoSave: () => ({
    data: undefined,
    setData: jest.fn(),
    clearAutoSave: jest.fn(),
    hasRecoveryData: false,
    recoveryPreview: undefined,
    hasCurrentData: false,
    saveStatus: 'idle' as const,
  }),
}));

// Mock worldStore
jest.mock('@/state/worldStore', () => ({
  useWorldStore: () => ({
    currentWorldId: 'world-1',
    worlds: {
      'world-1': {
        id: 'world-1',
        name: 'Test Realm',
        genre: 'fantasy',
        description: 'A fantasy world for testing',
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 20,
          skillPointPool: 20,
        },
        attributes: [
          {
            id: 'strength',
            name: 'Strength',
            description: 'Physical power',
            minValue: 1,
            maxValue: 10,
          },
        ],
        skills: [
          {
            id: 'athletics',
            name: 'Athletics',
            description: 'Athletic skill',
            minValue: 0,
            maxValue: 5,
            attributeIds: ['strength'],
          },
        ],
      },
    },
  }),
}));

// Mock react-joyride to simulate clicking Joyride's own Next/Finish buttons
let _lastJoyrideProps: Record<string, unknown> | null = null;

jest.mock('react-joyride', () => {
  const STATUS = {
    FINISHED: 'finished',
    SKIPPED: 'skipped',
  };

  const EVENTS = {
    TARGET_NOT_FOUND: 'target_not_found',
    STEP_AFTER: 'step_after',
  };

  const ACTIONS = {
    NEXT: 'next',
    PREV: 'prev',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DummyJoyride = ({ run, stepIndex, steps, callback, ...rest }: any) => {
    _lastJoyrideProps = { run, stepIndex, steps, callback, ...rest };
    if (!run) return null;

    const isLast = stepIndex >= steps.length - 1;

    return (
      <div data-testid="joyride-mock">
        <div data-testid="joyride-step-index">{stepIndex}</div>
        <div data-testid="joyride-total-steps">{steps.length}</div>
        {!isLast && (
          <button
            data-testid="joyride-next-btn"
            onClick={() => callback({ action: ACTIONS.NEXT, type: EVENTS.STEP_AFTER, index: stepIndex })}
          >
            Joyride Next
          </button>
        )}
        {isLast && (
          <button
            data-testid="joyride-finish-btn"
            onClick={() => callback({ status: STATUS.FINISHED, index: stepIndex })}
          >
            Finish Tutorial
          </button>
        )}
        <button
          data-testid="joyride-incomplete-finish-btn"
          onClick={() => callback({ status: STATUS.FINISHED, index: stepIndex })}
        >
          Incomplete Finish
        </button>
        <button
          data-testid="joyride-missing-target-btn"
          onClick={() => callback({ type: EVENTS.TARGET_NOT_FOUND, index: stepIndex })}
        >
          Missing Target
        </button>
      </div>
    );
  };

  return {
    __esModule: true,
    default: DummyJoyride,
    STATUS,
    EVENTS,
    ACTIONS,
  };
});

// Helper component to trigger tour start
const TourTrigger = () => {
  const { startTour, isTourActive } = useTutorial();
  return (
    <div>
      <div data-testid="tour-active">{isTourActive ? 'yes' : 'no'}</div>
      <button
        data-testid="start-char-tour-btn"
        onClick={() => startTour('characterCreationWizard')}
      >
        Start Character Creation Tour
      </button>
    </div>
  );
};

describe('CharacterCreationWizard Joyride Next integration', () => {
  beforeEach(() => {
    useSessionStore.getState().resetTutorialProgress();
    _lastJoyrideProps = null;
  });

  it('reaches all five tutorial steps by clicking Joyrides own Next button', async () => {
    render(
      <TutorialProvider>
        <TourTrigger />
        <CharacterCreationWizard worldId="world-1" />
      </TutorialProvider>
    );

    // Start tour
    await act(async () => {
      screen.getByTestId('start-char-tour-btn').click();
    });

    expect(screen.getByTestId('tour-active')).toHaveTextContent('yes');
    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('0');

    // Step 0: Basic Info step target should be on fields container, not section header
    const basicInfoTarget = document.querySelector('[data-tutorial="basic-info"]');
    expect(basicInfoTarget).not.toBeNull();
    expect(basicInfoTarget?.classList.contains('component-basic-info-fields')).toBe(true);
    expect(document.querySelector('.wizard-form-section-header[data-tutorial="basic-info"]')).toBeNull();

    // Click Joyride Next on Step 0 -> advances to Step 1 (Attributes)
    await act(async () => {
      screen.getByTestId('joyride-next-btn').click();
    });
    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('1');
    const attributeTarget = document.querySelector('[data-tutorial="attribute-allocation"]');
    expect(attributeTarget).not.toBeNull();
    expect(attributeTarget?.classList.contains('component-point-pool-manager')).toBe(true);
    expect(document.querySelector('.wizard-form-section-header[data-tutorial="attribute-allocation"]')).toBeNull();

    // Click Joyride Next on Step 1 -> advances to Step 2 (Skills)
    await act(async () => {
      screen.getByTestId('joyride-next-btn').click();
    });
    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('2');
    const skillTarget = document.querySelector('[data-tutorial="skill-selection"]');
    expect(skillTarget).not.toBeNull();
    expect(skillTarget?.classList.contains('wizard-skill-allocation-list')).toBe(true);
    expect(document.querySelector('.wizard-form-section-header[data-tutorial="skill-selection"]')).toBeNull();

    // Click Joyride Next on Step 2 -> advances to Step 3 (Background)
    await act(async () => {
      screen.getByTestId('joyride-next-btn').click();
    });
    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('3');
    const backgroundTarget = document.querySelector('[data-tutorial="background-editor"]');
    expect(backgroundTarget).not.toBeNull();
    expect(backgroundTarget?.tagName.toLowerCase()).toBe('textarea');
    expect(backgroundTarget?.id).toBe('character-history');
    expect(document.querySelector('.wizard-form-section-header[data-tutorial="background-editor"]')).toBeNull();

    // Click Joyride Next on Step 3 -> advances to Step 4 (Portrait)
    await act(async () => {
      screen.getByTestId('joyride-next-btn').click();
    });
    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('4');
    const portraitTarget = document.querySelector('[data-tutorial="portrait-generator-action"]');
    expect(portraitTarget).not.toBeNull();
    expect(portraitTarget?.tagName.toLowerCase()).toBe('button');
    expect(document.querySelector('.wizard-form-section-header[data-tutorial="portrait-generator-action"]')).toBeNull();

    // Click Finish on Step 4 -> completes tutorial phase
    await act(async () => {
      screen.getByTestId('joyride-finish-btn').click();
    });

    expect(screen.getByTestId('tour-active')).toHaveTextContent('no');
    expect(
      useSessionStore.getState().tutorialProgress.phases.characterCreation.completed
    ).toBe(true);
  });

  it('does NOT mark tutorial phase as completed if tour terminates before final step', async () => {
    render(
      <TutorialProvider>
        <TourTrigger />
        <CharacterCreationWizard worldId="world-1" />
      </TutorialProvider>
    );

    // Start tour
    await act(async () => {
      screen.getByTestId('start-char-tour-btn').click();
    });

    // Advance to Step 1
    await act(async () => {
      screen.getByTestId('joyride-next-btn').click();
    });
    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('1');

    // Trigger an incomplete finish (e.g. early exit callback at step 1)
    await act(async () => {
      screen.getByTestId('joyride-incomplete-finish-btn').click();
    });

    // Verify tour ended but phase was NOT marked completed
    expect(screen.getByTestId('tour-active')).toHaveTextContent('no');
    expect(
      useSessionStore.getState().tutorialProgress.phases.characterCreation.completed
    ).toBe(false);
  });

  it('preserves manual wizard Next navigation mid-tour without reverting', async () => {
    render(
      <TutorialProvider>
        <TourTrigger />
        <CharacterCreationWizard worldId="world-1" />
      </TutorialProvider>
    );

    // Start tour
    await act(async () => {
      screen.getByTestId('start-char-tour-btn').click();
    });

    expect(screen.getByTestId('tour-active')).toHaveTextContent('yes');
    expect(screen.getByTestId('joyride-step-index')).toHaveTextContent('0');
    expect(document.querySelector('[data-tutorial="basic-info"]')).not.toBeNull();

    // Fill in character name so step 0 is valid
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/character name/i), {
        target: { value: 'Hero' },
      });
    });

    // Click the wizard's own Next button (advancing wizard from step 0 to step 1)
    const wizardNextButton = screen.getByRole('button', { name: /^next$/i });
    await act(async () => {
      wizardNextButton.click();
    });

    // Wizard should advance to step 1 (Attributes) and not be reverted to step 0
    expect(document.querySelector('[data-tutorial="attribute-allocation"]')).not.toBeNull();
    expect(document.querySelector('[data-tutorial="basic-info"]')).toBeNull();

    // Click the wizard's own Back button (returning wizard from step 1 to step 0)
    const wizardBackButton = screen.getByRole('button', { name: /^back$/i });
    await act(async () => {
      wizardBackButton.click();
    });

    // Wizard should return to step 0 (Basic Info) and not be reverted to step 1
    expect(document.querySelector('[data-tutorial="basic-info"]')).not.toBeNull();
    expect(document.querySelector('[data-tutorial="attribute-allocation"]')).toBeNull();
  });
});

