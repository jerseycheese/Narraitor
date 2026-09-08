import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterCreationWizard } from '../CharacterCreationWizard';

import type { useCharacterCreationAutoSave as useAutoSaveHook } from '@/hooks/useCharacterCreationAutoSave';

type AutoSaveReturn = ReturnType<typeof useAutoSaveHook>;

const pauseTour = jest.fn();
const resumeTour = jest.fn();
const mockClearAutoSave = jest.fn();

let mockAutoSaveState: AutoSaveReturn = {
  data: undefined,
  setData: jest.fn(),
  clearAutoSave: mockClearAutoSave,
  hasRecoveryData: true,
  recoveryPreview: {
    name: 'Peren Ashford',
    currentStep: 1,
    totalAttributePoints: 8,
    hasAttributes: true,
  },
  hasCurrentData: false,
  saveStatus: 'idle' as const,
};

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
    isPaused: true,
    stepIndex: 0,
  }),
}));

jest.mock('@/hooks/useCharacterCreationAutoSave', () => ({
  useCharacterCreationAutoSave: () => mockAutoSaveState,
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

jest.mock('../steps/BasicInfoStep', () => ({
  BasicInfoStep: ({ data }: { data: { characterData: { name: string; description: string } } }) => (
    <div data-testid="basic-info-step">
      <span data-testid="character-name-value">{data.characterData.name}</span>
      <span data-testid="character-description-value">{data.characterData.description}</span>
    </div>
  ),
}));

jest.mock('../steps/AttributesStep', () => ({
  AttributesStep: ({
    data,
  }: {
    data: { characterData: { name: string; attributes: Array<{ attributeId: string; value: number }> } };
  }) => (
    <div data-testid="attributes-step">
      <span data-testid="attributes-character-name">{data.characterData.name}</span>
      <span data-testid="attributes-count">{data.characterData.attributes.length}</span>
    </div>
  ),
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
    mockAutoSaveState = {
      data: {
        currentStep: 1,
        worldId: 'world-1',
        characterData: {
          worldId: 'world-1',
          name: 'Peren Ashford',
          description: 'A courageous adventurer',
          portraitPlaceholder: '',
          portrait: { type: 'placeholder', url: null },
          attributes: [
            {
              attributeId: 'strength',
              name: 'Strength',
              description: 'Power',
              value: 8,
              minValue: 1,
              maxValue: 10,
            },
          ],
          skills: [
            {
              skillId: 'athletics',
              name: 'Athletics',
              description: 'Athletic ability',
              level: 3,
              minLevel: 0,
              maxLevel: 5,
              isSelected: true,
            },
          ],
          background: {
            history: 'Grew up in the forest',
            personality: 'Brave',
            goals: ['Explore ruins'],
            motivation: 'Discovery',
          },
        },
        validation: {
          0: { valid: true, touched: true, errors: [] },
        },
        pointPools: {
          attributes: 0,
          skills: 0,
        },
      },
      setData: jest.fn(),
      clearAutoSave: mockClearAutoSave,
      hasRecoveryData: true,
      recoveryPreview: {
        name: 'Peren Ashford',
        currentStep: 1,
        totalAttributePoints: 8,
        hasAttributes: true,
      },
      hasCurrentData: false,
      saveStatus: 'idle' as const,
    };
  });

  it('pauses the tutorial while the recovery dialog is active', async () => {
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
    expect(mockClearAutoSave).toHaveBeenCalled();
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    expect(screen.getByTestId('character-name-value')).toHaveTextContent('');
  });

  it('restores the saved draft values and step into the wizard when Recover Progress is clicked', async () => {
    const user = userEvent.setup();
    render(<CharacterCreationWizard worldId="world-1" />);

    // Before clicking recover, dialog is visible
    const recoverButton = await screen.findByRole('button', { name: 'Recover Progress' });
    await user.click(recoverButton);

    // Wizard should restore to step 1 (Attributes) with saved draft name and attributes
    await waitFor(() => {
      expect(screen.getByTestId('attributes-step')).toBeInTheDocument();
    });
    expect(screen.getByTestId('attributes-character-name')).toHaveTextContent('Peren Ashford');
    expect(screen.getByTestId('attributes-count')).toHaveTextContent('1');

    // Navigating back to step 0 should show restored Basic Info values
    const backButton = screen.getByRole('button', { name: 'Back' });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    });
    expect(screen.getByTestId('character-name-value')).toHaveTextContent('Peren Ashford');
    expect(screen.getByTestId('character-description-value')).toHaveTextContent(
      'A courageous adventurer'
    );
  });

  it('restores draft onto step 0 when saved on step 0', async () => {
    if (mockAutoSaveState.data) {
      mockAutoSaveState.data.currentStep = 0;
    }
    if (mockAutoSaveState.recoveryPreview) {
      mockAutoSaveState.recoveryPreview.currentStep = 0;
    }

    const user = userEvent.setup();
    render(<CharacterCreationWizard worldId="world-1" />);

    const recoverButton = await screen.findByRole('button', { name: 'Recover Progress' });
    await user.click(recoverButton);

    await waitFor(() => {
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    });
    expect(screen.getByTestId('character-name-value')).toHaveTextContent('Peren Ashford');
    expect(screen.getByTestId('character-description-value')).toHaveTextContent(
      'A courageous adventurer'
    );
  });
});
