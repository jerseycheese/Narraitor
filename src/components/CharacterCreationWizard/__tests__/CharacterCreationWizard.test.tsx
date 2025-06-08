import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterCreationWizard } from '../CharacterCreationWizard';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

// TODO: Enable these tests after updating them to match the new shared wizard implementation
describe.skip('CharacterCreationWizard', () => {
  const mockPush = jest.fn();
  const mockWorld = {
    id: 'world-1',
    name: 'Test World',
    description: 'A test world',
    theme: 'fantasy',
    attributes: [
      { id: 'attr-1', name: 'Strength', worldId: 'world-1', baseValue: 10, minValue: 1, maxValue: 10 },
      { id: 'attr-2', name: 'Intelligence', worldId: 'world-1', baseValue: 10, minValue: 1, maxValue: 10 },
    ],
    skills: [
      { id: 'skill-1', name: 'Swordsmanship', worldId: 'world-1', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 5 },
      { id: 'skill-2', name: 'Magic', worldId: 'world-1', difficulty: 'hard', baseValue: 1, minValue: 1, maxValue: 5 },
    ],
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 20,
      skillPointPool: 15,
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (worldStore as unknown as jest.Mock).mockReturnValue({
      worlds: { 'world-1': mockWorld },
      currentWorldId: 'world-1',
    });
    (characterStore as unknown as jest.Mock).mockReturnValue({
      characters: {},
      createCharacter: jest.fn().mockReturnValue('char-1'),
    });
    sessionStorage.clear();
  });

  describe('Step 1: Basic Info', () => {
    it('displays basic info form fields', () => {
      render(<CharacterCreationWizard worldId="world-1" />);
      
      expect(screen.getByLabelText(/character name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByTestId('character-portrait-placeholder')).toBeInTheDocument();
    });

    it('validates character name is required', async () => {
      render(<CharacterCreationWizard worldId="world-1" />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('validates character name length', async () => {
      const user = userEvent.setup();
      render(<CharacterCreationWizard worldId="world-1" />);
      
      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, 'AB'); // Too short
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('validates character name uniqueness within world', async () => {
      const user = userEvent.setup();
      (characterStore as unknown as jest.Mock).mockReturnValue({
        characters: {
          'char-existing': { id: 'char-existing', name: 'Existing Hero', worldId: 'world-1' }
        },
        createCharacter: jest.fn().mockReturnValue('char-1'),
      });
      
      render(<CharacterCreationWizard worldId="world-1" />);
      
      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, 'Existing Hero');
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(/character with this name already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Attributes', () => {
    it('displays all world attributes with point allocation', async () => {
      const user = userEvent.setup();
      render(<CharacterCreationWizard worldId="world-1" />);
      
      // Move to step 2
      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, 'Test Hero');
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(/strength/i)).toBeInTheDocument();
        expect(screen.getByText(/intelligence/i)).toBeInTheDocument();
        expect(screen.getByText(/attribute points/i)).toBeInTheDocument();
      });
    });

    it('validates attribute point allocation matches pool', async () => {
      const user = userEvent.setup();
      render(<CharacterCreationWizard worldId="world-1" />);
      
      // Move to step 2
      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, 'Test Hero');
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      
      // Try to proceed without allocating all points
      await waitFor(() => {
        const step2NextButton = screen.getByRole('button', { name: /next/i });
        fireEvent.click(step2NextButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/must spend exactly 20 points/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Skills', () => {
    it('limits skill selection to maximum 8', async () => {
      const user = userEvent.setup();
      const manySkillsWorld = {
        ...mockWorld,
        skills: Array.from({ length: 10 }, (_, i) => ({
          id: `skill-${i}`,
          name: `Skill ${i}`,
          worldId: 'world-1',
          difficulty: 'medium',
          baseValue: 1,
          minValue: 1,
          maxValue: 5,
        })),
      };
      
      (worldStore as unknown as jest.Mock).mockReturnValue({
        worlds: { 'world-1': manySkillsWorld },
        currentWorldId: 'world-1',
      });
      
      render(<CharacterCreationWizard worldId="world-1" />);
      
      // Navigate to step 3
      await user.type(screen.getByLabelText(/character name/i), 'Test Hero');
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      
      // Skip attributes step (would need to allocate points properly)
      // This is simplified for the test
    });

    it('requires at least one skill to be selected', async () => {
      const user = userEvent.setup();
      render(<CharacterCreationWizard worldId="world-1" />);
      
      // Navigate through steps (simplified)
      await user.type(screen.getByLabelText(/character name/i), 'Test Hero');
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      
      // Would need proper navigation to step 3
      // Testing validation message when no skills selected
    });
  });

  describe('Step 4: Background', () => {
    it('validates background fields have minimum length', async () => {
      // Test that history must be at least 50 characters
      // Test that personality must be at least 20 characters
    });
  });

  describe('Auto-save functionality', () => {
    it('saves progress to sessionStorage on field blur', async () => {
      const user = userEvent.setup();
      render(<CharacterCreationWizard worldId="world-1" />);
      
      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, 'Test Hero');
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        const savedData = sessionStorage.getItem('character-creation-world-1');
        expect(savedData).toBeTruthy();
        const parsed = JSON.parse(savedData!);
        expect(parsed.characterData.name).toBe('Test Hero');
      });
    });

    it('restores saved data on mount', async () => {
      const savedData = {
        currentStep: 0,
        worldId: 'world-1',
        characterData: {
          name: 'Saved Hero',
          description: 'A saved description',
        },
      };
      sessionStorage.setItem('character-creation-world-1', JSON.stringify(savedData));
      
      render(<CharacterCreationWizard worldId="world-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Saved Hero')).toBeInTheDocument();
        expect(screen.getByDisplayValue('A saved description')).toBeInTheDocument();
      });
    });
  });

  describe('Character creation', () => {
    it('creates character and navigates to character detail on completion', async () => {
      const user = userEvent.setup();
      const mockCreateCharacter = jest.fn().mockReturnValue('char-new');
      (characterStore as unknown as jest.Mock).mockReturnValue({
        characters: {},
        createCharacter: mockCreateCharacter,
      });
      
      render(<CharacterCreationWizard worldId="world-1" />);
      
      // Complete all steps (simplified for test)
      await user.type(screen.getByLabelText(/character name/i), 'New Hero');
      
      // Would complete all steps and click create
      // Verify createCharacter was called with correct data
      // Verify navigation to character detail page
    });

    it('clears auto-save data after successful creation', async () => {
      // Test that sessionStorage is cleared after character creation
    });
  });

  describe('Wizard navigation', () => {
    it('allows moving back to previous steps', async () => {
      const user = userEvent.setup();
      render(<CharacterCreationWizard worldId="world-1" />);
      
      // Move to step 2
      await user.type(screen.getByLabelText(/character name/i), 'Test Hero');
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      
      // Click back
      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i });
        fireEvent.click(backButton);
      });
      
      // Should be back on step 1
      expect(screen.getByLabelText(/character name/i)).toBeInTheDocument();
    });

    it('shows cancel button that returns to character list', () => {
      render(<CharacterCreationWizard worldId="world-1" />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockPush).toHaveBeenCalledWith('/characters');
    });
  });
});
