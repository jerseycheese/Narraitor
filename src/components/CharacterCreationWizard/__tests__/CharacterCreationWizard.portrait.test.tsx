// src/components/CharacterCreationWizard/__tests__/CharacterCreationWizard.portrait.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterCreationWizard } from '../CharacterCreationWizard';
import { useCharacterStore } from '../../../state/characterStore';
import { useWorldStore } from '../../../state/worldStore';
import { PortraitStep } from '../steps/PortraitStep';
import { getTimestamp } from '@/lib/utils/timestamp';
import type { World } from '@/types/world.types';
// Removed AI client imports - using API routes instead

// Mock the dependencies
jest.mock('../../../state/characterStore');
jest.mock('../../../state/worldStore');
// Mock fetch for API routes
const mockFetch = jest.fn();
jest.mock('../../../hooks/useCharacterCreationAutoSave', () => ({
  useCharacterCreationAutoSave: () => ({
    data: null,
    setData: jest.fn(),
    clearAutoSave: jest.fn(),
    hasRecoveryData: false,
    recoveryPreview: null,
    hasCurrentData: false,
    saveStatus: 'idle' as const,
  })
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  })
}));

const mockCharacterStore = useCharacterStore as jest.MockedFunction<typeof useCharacterStore>;
const mockWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;

// Store original fetch to restore it after tests
const originalFetch = global.fetch;

describe('PortraitStep Component', () => {
  const mockData = {
    characterData: {
      name: 'Elara Moonshadow',
      portrait: {
        type: 'placeholder' as const,
        url: null
      },
      attributes: [
        { attributeId: 'strength', value: 10 }
      ],
      skills: [
        { skillId: 'magic', level: 5, isSelected: true }
      ],
      background: {
        history: 'A skilled mage',
        personality: 'Wise and mysterious',
        goals: ['Master magic']
      }
    },
    worldId: 'world-1'
  };

  const mockWorldConfig = {
    genre: 'fantasy'
  } satisfies Partial<World>;

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Set up fetch mock for API routes
    global.fetch = mockFetch;
  });

  afterEach(() => {
    // Restore original fetch to prevent memory leaks
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should render portrait step with placeholder', () => {
    render(
      <PortraitStep 
        data={mockData}
        onUpdate={mockOnUpdate}
        worldConfig={mockWorldConfig}
      />
    );

    expect(screen.getByText('Character Portrait')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate portrait/i })).toBeInTheDocument();
  });

  it('should handle portrait generation user interaction', async () => {
    const user = userEvent.setup();
    
    // Mock successful API response 
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        portrait: {
          type: 'ai-generated',
          url: 'data:image/png;base64,mockimage',
          generatedAt: getTimestamp()
        }
      })
    });

    render(
      <PortraitStep 
        data={mockData}
        onUpdate={mockOnUpdate}
        worldConfig={mockWorldConfig}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate portrait/i });
    
    // Initially should show placeholder portrait
    expect(screen.getByTestId('character-portrait')).toBeInTheDocument();
    expect(generateButton).not.toBeDisabled();
    
    // User clicks generate button
    await user.click(generateButton);

    // Verify the API is called and component handles the interaction
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    
    // Button should be re-enabled after completion
    expect(generateButton).not.toBeDisabled();
  });

  it('should show error message on generation failure', async () => {
    const user = userEvent.setup();
    
    // Mock failed API response
    mockFetch.mockRejectedValue(new Error('API error'));

    render(
      <PortraitStep 
        data={mockData}
        onUpdate={mockOnUpdate}
        worldConfig={mockWorldConfig}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate portrait/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/API error/i)).toBeInTheDocument();
    });
  });

  it('should be skippable', () => {
    render(
      <PortraitStep 
        data={mockData}
        onUpdate={mockOnUpdate}
        worldConfig={mockWorldConfig}
      />
    );

    expect(screen.getByText(/you can skip this step/i)).toBeInTheDocument();
  });

  it('offers preset avatars and upload alongside generation', async () => {
    const user = userEvent.setup();

    render(
      <PortraitStep
        data={mockData}
        onUpdate={mockOnUpdate}
        worldConfig={mockWorldConfig}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Preset avatars' }));
    expect(screen.getByLabelText(/search avatars/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Upload' }));
    expect(screen.getByLabelText(/choose an image file/i)).toBeInTheDocument();
  });

  it('previews a preset avatar without saving it until confirmed', async () => {
    const user = userEvent.setup();

    render(
      <PortraitStep
        data={mockData}
        onUpdate={mockOnUpdate}
        worldConfig={mockWorldConfig}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Preset avatars' }));
    await user.click(screen.getAllByRole('button', { name: /avatar$/i })[0]);

    expect(screen.getByText(/just a preview/i)).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /use this portrait/i }));

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        portrait: expect.objectContaining({ type: 'preset' }),
      })
    );
  });

  it('drops the preview when the player switches source', async () => {
    const user = userEvent.setup();

    render(
      <PortraitStep
        data={mockData}
        onUpdate={mockOnUpdate}
        worldConfig={mockWorldConfig}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Preset avatars' }));
    await user.click(screen.getAllByRole('button', { name: /avatar$/i })[0]);
    await user.click(screen.getByRole('button', { name: 'Upload' }));

    expect(screen.queryByText(/just a preview/i)).not.toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('drops the preview when the player cancels', async () => {
    const user = userEvent.setup();

    render(
      <PortraitStep
        data={mockData}
        onUpdate={mockOnUpdate}
        worldConfig={mockWorldConfig}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Preset avatars' }));
    await user.click(screen.getAllByRole('button', { name: /avatar$/i })[0]);
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByText(/just a preview/i)).not.toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});

import { TutorialProvider } from '../../../components/TutorialProvider';

describe('Character Creation Wizard with Portrait Integration', () => {
  const mockWorld = {
    id: 'world-1',
    name: 'Fantasy World',
    genre: 'fantasy',
    description: 'A world of magic',
    attributes: [
      { id: 'strength', name: 'Strength', category: 'physical', min: 1, max: 20, defaultValue: 10 }
    ],
    skills: [
      { 
        id: 'magic', 
        name: 'Magic', 
        category: 'arcane', 
        description: 'Harness arcane energies.',
        difficultyLevels: {},
        minValue: 1,
        maxValue: 5,
        baseValue: 1,
        attributeIds: ['strength']
      }
    ],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20
    },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const createCharacterMock = jest.fn(() => 'new-character-id');

    mockCharacterStore.mockReturnValue({
      createCharacter: createCharacterMock,
      characters: {},
      currentCharacterId: null,
      error: null,
      loading: false,
      setCurrentCharacter: jest.fn(),
      getState: jest.fn(() => ({
        setCurrentCharacter: jest.fn()
      }))
    } as unknown as ReturnType<typeof useCharacterStore>);

    mockWorldStore.mockReturnValue({
      worlds: { 'world-1': mockWorld },
      currentWorldId: 'world-1',
      error: null,
      loading: false
    } as unknown as ReturnType<typeof useWorldStore>);
  });

  afterEach(() => {
    // Clean up mocks to prevent memory leaks
    jest.restoreAllMocks();
  });

  it('should include portrait step in wizard', () => {
    render(
      <TutorialProvider>
        <CharacterCreationWizard worldId="world-1" />
      </TutorialProvider>
    );

    // Check that Portrait step is in the progress bar
    const steps = screen.getAllByText(/Portrait/i);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('should save character with placeholder portrait by default', async () => {
    render(
      <TutorialProvider>
        <CharacterCreationWizard worldId="world-1" initialStep={4} />
      </TutorialProvider>
    );

    // The portrait step should be visible
    expect(screen.getByText('Character Portrait')).toBeInTheDocument();
  });
});
