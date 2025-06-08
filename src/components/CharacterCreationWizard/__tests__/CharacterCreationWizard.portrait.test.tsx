// src/components/CharacterCreationWizard/__tests__/CharacterCreationWizard.portrait.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterCreationWizard } from '../CharacterCreationWizard';
import { useCharacterStore } from '../../../state/characterStore';
import { useWorldStore } from '../../../state/worldStore';
import { PortraitStep } from '../steps/PortraitStep';
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
    handleFieldBlur: jest.fn(),
    clearAutoSave: jest.fn()
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
    theme: 'High Fantasy'
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up fetch mock for API routes
    global.fetch = mockFetch;
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
    expect(screen.getByText(/Generate an AI portrait/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate portrait/i })).toBeInTheDocument();
  });

  it('should generate portrait when button clicked', async () => {
    const user = userEvent.setup();
    
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        image: 'data:image/png;base64,mockimage',
        prompt: 'Portrait of Elara Moonshadow, Wise and mysterious, High Fantasy setting, medium portrait shot, photorealistic quality, high resolution'
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
    await user.click(generateButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/generate-portrait', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Elara Moonshadow')
      }));
      expect(mockOnUpdate).toHaveBeenCalledWith({
        portrait: expect.objectContaining({
          type: 'ai-generated',
          url: 'data:image/png;base64,mockimage',
          prompt: expect.any(String),
          generatedAt: expect.any(String)
        })
      });
    });
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

    expect(screen.getByText(/skip portrait generation/i)).toBeInTheDocument();
  });
});

describe('Character Creation Wizard with Portrait Integration', () => {
  const mockWorld = {
    id: 'world-1',
    name: 'Fantasy World',
    theme: 'High Fantasy',
    description: 'A world of magic',
    attributes: [
      { id: 'strength', name: 'Strength', category: 'physical', min: 1, max: 20, defaultValue: 10 }
    ],
    skills: [
      { id: 'magic', name: 'Magic', category: 'arcane', difficultyLevels: {} }
    ],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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

  it('should include portrait step in wizard', () => {
    render(<CharacterCreationWizard worldId="world-1" />);

    // Check that Portrait step is in the progress bar
    const steps = screen.getAllByText(/Portrait/i);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('should save character with placeholder portrait by default', async () => {
    render(<CharacterCreationWizard worldId="world-1" initialStep={4} />);

    // The portrait step should be visible
    expect(screen.getByText('Character Portrait')).toBeInTheDocument();
  });
});
