import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterCreationWizard } from '../CharacterCreationWizard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('@/components/TutorialProvider', () => ({
  useTutorial: () => ({
    setCurrentWizardStep: jest.fn(),
    pauseTour: jest.fn(),
    resumeTour: jest.fn(),
    currentTour: null,
    isTourActive: false,
    isPaused: false,
    stepIndex: 0,
  }),
}));

jest.mock('@/hooks/useDraftAutoSave', () => ({
  useDraftAutoSave: () => ({
    data: undefined,
    setData: jest.fn(),
    clearAutoSave: jest.fn(),
    dismissRecovery: jest.fn(),
    hasRecoveryData: false,
    recoveryPreview: null,
    hasCurrentData: false,
    saveStatus: 'idle' as const,
    isLoaded: true,
  }),
}));

jest.mock('@/hooks/useCharacterPointPools', () => ({
  useCharacterPointPools: () => ({
    attributePool: { pool: 0 },
    skillPool: 0,
  }),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: () => ({
    worlds: {
      'world-1': {
        id: 'world-1',
        name: 'Test World',
        genre: 'fantasy',
        description: 'A test world',
        settings: {
          attributePointPool: 20,
          skillPointPool: 20,
        },
        attributes: [],
        skills: [],
      },
    },
  }),
}));

// Only the Background step matters for this test; keep the others inert.
jest.mock('../steps/BasicInfoStep', () => ({
  BasicInfoStep: () => <div data-testid="basic-info-step" />,
}));
jest.mock('../steps/AttributesStep', () => ({
  AttributesStep: () => <div data-testid="attributes-step" />,
}));
jest.mock('../steps/SkillsStep', () => ({
  SkillsStep: () => <div data-testid="skills-step" />,
}));
jest.mock('../steps/PortraitStep', () => ({
  PortraitStep: () => <div data-testid="portrait-step" />,
}));

describe('CharacterCreationWizard untouched-field validation (#2178)', () => {
  it('does not show the Personality required error while typing a valid value before blurring it', async () => {
    const user = userEvent.setup();
    render(<CharacterCreationWizard worldId="world-1" initialStep={3} />);

    const personality = await screen.findByLabelText(/Personality/);
    await user.type(personality, 'Cheerful and endlessly curious about the world.');

    expect(
      screen.queryByText(/Personality description is required/i)
    ).not.toBeInTheDocument();
  });

  it('does not surface an untouched Personality error just from blurring the History field', async () => {
    const user = userEvent.setup();
    render(<CharacterCreationWizard worldId="world-1" initialStep={3} />);

    const history = await screen.findByLabelText(/Character History/);
    await user.click(history);
    await user.tab();

    expect(
      screen.queryByText(/Personality description is required/i)
    ).not.toBeInTheDocument();
  });

  it('shows the Personality required error once that field is blurred while still empty', async () => {
    const user = userEvent.setup();
    render(<CharacterCreationWizard worldId="world-1" initialStep={3} />);

    const personality = await screen.findByLabelText(/Personality/);
    await user.click(personality);
    await user.tab();

    expect(screen.getByText(/Personality description is required/i)).toBeInTheDocument();
  });
});
