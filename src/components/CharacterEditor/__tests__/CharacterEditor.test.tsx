import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CharacterEditor from '../CharacterEditor';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import {
  mockZustandStore,
  createMockCharacterStore,
  createMockWorldStore,
} from '@/lib/test-utils';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the stores
jest.mock('@/state/characterStore');
jest.mock('@/state/worldStore');

const mockRouter = {
  push: jest.fn(),
};

const mockCharacter = {
  id: 'test-char-1',
  name: 'Test Character',
  description: 'A test character',
  worldId: 'test-world-1',
  level: 1,
  attributes: [
    {
      id: 'attr-1',
      characterId: 'test-char-1',
      name: 'Strength',
      baseValue: 10,
      modifiedValue: 10,
    },
  ],
  skills: [
    {
      id: 'skill-1',
      characterId: 'test-char-1',
      name: 'Swordsmanship',
      level: 5,
    },
  ],

  derivedStats: [],
  background: {
    history: 'Test history',
    personality: 'Test personality',
    goals: ['Test goal'],
    fears: ['Test fear'],
    physicalDescription: 'Test description',
    relationships: [],
  },
  isPlayer: true,
  status: {
    conditions: [],
  },
  inventory: {
    characterId: 'test-char-1',
    items: [],
    capacity: 20,
    categories: [],
    itemOrder: [],
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockWorld = {
  id: 'test-world-1',
  name: 'Test World',
  description: 'A test world',
  genre: 'fantasy' as const,
  attributes: [
    {
      id: 'attr-1',
      worldId: 'test-world-1',
      name: 'Strength',
      description: 'Physical power',
      minValue: 1,
      maxValue: 20,
      baseValue: 10,
    },
  ],
  skills: [
    {
      id: 'skill-1',
      worldId: 'test-world-1',
      name: 'Swordsmanship',
      description: 'Skill with bladed weapons',
      minValue: 0,
      maxValue: 10,
      baseValue: 0,
      difficulty: 'medium' as const,
    },
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 10,
    attributePointPool: 50,
    skillPointPool: 30,
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('CharacterEditor MVP Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Mock character store
    mockZustandStore(
      useCharacterStore as jest.MockedFunction<typeof useCharacterStore>,
      createMockCharacterStore({
        characters: { 'test-char-1': mockCharacter },
        updateCharacter: jest.fn(),
        deleteCharacter: jest.fn(),
      })
    );

    // Mock world store
    mockZustandStore(
      useWorldStore as jest.MockedFunction<typeof useWorldStore>,
      createMockWorldStore({
        worlds: { 'test-world-1': mockWorld },
      })
    );
  });

  // Acceptance Criteria 1: An editing interface allows modification of existing character fields
  test('allows modification of character fields', async () => {
    render(<CharacterEditor characterId="test-char-1" />);

    // Wait for character to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Character')).toBeInTheDocument();
    });

    // Verify we can modify name field
    const nameInput = screen.getByDisplayValue('Test Character');
    fireEvent.change(nameInput, { target: { value: 'Modified Character' } });
    expect(nameInput).toHaveValue('Modified Character');
  });

  test('saves changes when user clicks save', async () => {
    const mockUpdateCharacter = jest.fn();
    mockZustandStore(
      useCharacterStore as jest.MockedFunction<typeof useCharacterStore>,
      createMockCharacterStore({
        characters: { 'test-char-1': mockCharacter },
        updateCharacter: mockUpdateCharacter,
        deleteCharacter: jest.fn(),
      })
    );

    render(<CharacterEditor characterId="test-char-1" />);

    // Wait for character to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Character')).toBeInTheDocument();
    });

    // Modify character name
    const nameInput = screen.getByDisplayValue('Test Character');
    fireEvent.change(nameInput, { target: { value: 'Modified Character' } });

    // Click save button
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Verify updateCharacter was called and navigation occurred
    await waitFor(() => {
      expect(mockUpdateCharacter).toHaveBeenCalled();
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/characters/test-char-1');
  });

  // Acceptance Criteria 5: Users can cancel edits without saving changes
  test('cancels edits without saving changes', async () => {
    const mockUpdateCharacter = jest.fn();
    mockZustandStore(
      useCharacterStore as jest.MockedFunction<typeof useCharacterStore>,
      createMockCharacterStore({
        characters: { 'test-char-1': mockCharacter },
        updateCharacter: mockUpdateCharacter,
        deleteCharacter: jest.fn(),
      })
    );

    render(<CharacterEditor characterId="test-char-1" />);

    // Wait for character to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Character')).toBeInTheDocument();
    });

    // Modify character name
    const nameInput = screen.getByDisplayValue('Test Character');
    fireEvent.change(nameInput, { target: { value: 'Modified Character' } });

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Verify updateCharacter was NOT called
    expect(mockUpdateCharacter).not.toHaveBeenCalled();

    // Verify navigation occurred
    expect(mockRouter.push).toHaveBeenCalledWith('/characters/test-char-1');
  });

  // Basic error handling test
  test('displays error when character not found', async () => {
    mockZustandStore(
      useCharacterStore as jest.MockedFunction<typeof useCharacterStore>,
      createMockCharacterStore({
        characters: {},
        updateCharacter: jest.fn(),
        deleteCharacter: jest.fn(),
      })
    );

    render(<CharacterEditor characterId="non-existent" />);

    // Wait for the hydration timeout (2 seconds) to show error
    expect(
      await screen.findByText('Character Not Found', {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });
});
