import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterCreationWizard } from '../CharacterCreationWizard';

const pauseTour = jest.fn();
const resumeTour = jest.fn();

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
    pauseTour,
    resumeTour,
    currentTour: 'characterCreationWizard',
    isTourActive: true,
  }),
}));

jest.mock('@/hooks/useCharacterCreationAutoSave', () => ({
  useCharacterCreationAutoSave: () => ({
    data: null,
    setData: jest.fn(),
    clearAutoSave: jest.fn(),
    hasRecoveryData: true,
    recoveryPreview: {
      name: 'Bob Smith',
      currentStep: 2,
      totalAttributePoints: 6,
      hasAttributes: true,
    },
    hasCurrentData: false,
    saveStatus: 'idle' as const,
  }),
}));

jest.mock('@/hooks/useCharacterCreationWizard', () => ({
  useCharacterCreationWizard: () => ({
    wizard: {
      state: {
        currentStep: 0,
        data: {
          worldId: 'world-1',
          name: '',
          description: '',
          attributes: [],
          skills: [],
          background: {},
        },
        validation: {
          0: { valid: true, touched: false, errors: [] },
        },
      },
      canGoBack: false,
      canGoNext: true,
      isLastStep: false,
      goNext: jest.fn(),
      goBack: jest.fn(),
      goToStep: jest.fn(),
      updateData: jest.fn(),
      setValidation: jest.fn(),
    },
    steps: [
      { id: 'template', label: 'Template' },
      { id: 'basic', label: 'Basic Info' },
    ],
    stepValidators: [],
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
        attributes: [
          {
            id: 'strength',
            name: 'Strength',
            description: 'Power',
            minValue: 1,
            maxValue: 10,
          },
        ],
        skills: [
          {
            id: 'athletics',
            name: 'Athletics',
            description: 'Athletic ability',
            minValue: 0,
            maxValue: 5,
            attributeIds: ['strength'],
          },
        ],
      },
    },
  }),
}));

jest.mock('../steps/TemplateSelectionStep', () => ({
  TemplateSelectionStep: () => <div data-testid="template-step" />,
}));

jest.mock('../steps/BasicInfoStep', () => ({
  BasicInfoStep: () => <div data-testid="basic-info-step" />,
}));

jest.mock('../steps/AttributesStep', () => ({
  AttributesStep: () => <div data-testid="attributes-step" />,
}));

jest.mock('../steps/SkillsStep', () => ({
  SkillsStep: () => <div data-testid="skills-step" />,
}));

jest.mock('../steps/BackgroundStep', () => ({
  BackgroundStep: () => <div data-testid="background-step" />,
}));

jest.mock('../steps/PortraitStep', () => ({
  PortraitStep: () => <div data-testid="portrait-step" />,
}));

describe('CharacterCreationWizard recovery modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pauses the tutorial while the recovery dialog is', async () => {
    render(<CharacterCreationWizard worldId="world-1" />);

    await waitFor(() => {
      expect(pauseTour).toHaveBeenCalled();
    });
  });

  it('resumes the tutorial after dismissing the recovery dialog', async () => {
    const user = userEvent.setup();
    render(<CharacterCreationWizard worldId="world-1" />);

    const dismissButton = await screen.findByRole('button', { name: 'Start Fresh' });
    await user.click(dismissButton);

    await waitFor(() => {
      expect(resumeTour).toHaveBeenCalled();
    });
  });
});
