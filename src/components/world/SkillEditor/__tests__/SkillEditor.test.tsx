import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillEditor } from '../SkillEditor';
import { WorldSkill, WorldAttribute } from '@/types/world.types';
// Note: SkillDifficulty type is used implicitly in WorldSkill interface

// Mock components
jest.mock('@/components/DeleteConfirmationDialog', () => {
  return function MockDeleteConfirmationDialog({ 
    isOpen, 
    onConfirm, 
    onClose
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="delete-dialog">
        <p>Delete confirmation</p>
        <button onClick={onConfirm} data-testid="confirm-delete">Confirm</button>
        <button onClick={onClose} data-testid="cancel-delete">Cancel</button>
      </div>
    );
  };
});

// Test data
const mockWorldId = 'world-1';
const createMockAttribute = (id: string, name: string, description: string, baseValue: number): WorldAttribute => ({
  id, name, description, worldId: mockWorldId, baseValue, minValue: 1, maxValue: 10
});

const mockAttributes: WorldAttribute[] = [
  createMockAttribute('attr-1', 'Strength', 'Physical power', 8),
  createMockAttribute('attr-2', 'Intelligence', 'Mental ability', 7),
  createMockAttribute('attr-3', 'Dexterity', 'Agility and precision', 6)
];

const mockSkills: WorldSkill[] = [
  {
    id: 'skill-1',
    name: 'Swordsmanship',
    description: 'Combat with bladed weapons',
    worldId: mockWorldId,
    attributeIds: ['attr-1', 'attr-3'],
    difficulty: 'medium',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  },
];

const mockProps = {
  worldId: mockWorldId,
  mode: 'create' as const,
  onSave: jest.fn(),
  onCancel: jest.fn(),
  existingAttributes: mockAttributes,
  existingSkills: mockSkills,
};

// Test helpers
const renderAndSetup = (props = mockProps) => {
  const user = userEvent.setup();
  render(<SkillEditor {...props} />);
  return user;
};

const fillSkillForm = async (user: ReturnType<typeof userEvent.setup>, name: string, description: string, attributeNames: string[] = []) => {
  await user.type(screen.getByLabelText(/skill name/i), name);
  await user.type(screen.getByLabelText(/description/i), description);
  for (const attrName of attributeNames) {
    await user.click(screen.getByLabelText(attrName));
  }
};

describe('SkillEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create mode interface correctly', () => {
      render(<SkillEditor {...mockProps} />);
      
      expect(screen.getByText('Create New Skill')).toBeInTheDocument();
      expect(screen.getByLabelText(/skill name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByText('Linked Attributes')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create skill/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('displays all available attributes as checkboxes', () => {
      render(<SkillEditor {...mockProps} />);
      
      mockAttributes.forEach(attr => {
        expect(screen.getByLabelText(attr.name)).toBeInTheDocument();
      });
    });

    it('allows creating a skill with multiple attribute links', async () => {
      const user = renderAndSetup();
      await fillSkillForm(user, 'Acrobatics', 'Tumbling and gymnastics', ['Strength', 'Dexterity']);
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(mockProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Acrobatics',
          description: 'Tumbling and gymnastics',
          attributeIds: ['attr-1', 'attr-3'],
          worldId: mockWorldId,
        })
      );
    });

    it('prevents creating skills with duplicate names', async () => {
      const user = renderAndSetup();
      
      await user.type(screen.getByLabelText(/skill name/i), 'Swordsmanship'); // Duplicate name
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.click(screen.getByLabelText('Strength'));
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/skill name "Swordsmanship" already exists/i)).toBeInTheDocument();
      expect(mockProps.onSave).not.toHaveBeenCalled();
    });

    it('requires at least one attribute to be selected', async () => {
      const user = renderAndSetup();
      
      await fillSkillForm(user, 'New Skill', 'Test description');
      // Don't select any attributes
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/at least one attribute must be selected/i)).toBeInTheDocument();
      expect(mockProps.onSave).not.toHaveBeenCalled();
    });

    it('validates required fields', async () => {
      const user = renderAndSetup();
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/skill name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(mockProps.onSave).not.toHaveBeenCalled();
    });

    it('enforces maximum skills limit when provided', () => {
      const skillsAtMax = Array.from({ length: 12 }, (_, i) => ({
        id: `skill-${i}`,
        name: `Skill ${i}`,
        description: `Description ${i}`,
        worldId: mockWorldId,
        attributeIds: ['attr-1'],
        difficulty: 'easy' as const,
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
      }));

      render(
        <SkillEditor 
          {...mockProps} 
          existingSkills={skillsAtMax}
          maxSkills={12}
        />
      );
      
      expect(screen.getByText(/maximum number of skills \(12\) reached/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create skill/i })).toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    const editProps = {
      ...mockProps,
      mode: 'edit' as const,
      skillId: 'skill-1',
      onDelete: jest.fn(),
    };

    it('renders edit mode interface correctly', () => {
      render(<SkillEditor {...editProps} />);
      
      expect(screen.getByText('Edit Skill')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete skill/i })).toBeInTheDocument();
    });

    it('loads existing skill data for editing', () => {
      render(<SkillEditor {...editProps} />);
      
      expect(screen.getByDisplayValue('Swordsmanship')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Combat with bladed weapons')).toBeInTheDocument();
      
      expect(screen.getByLabelText('Strength')).toBeChecked();
      expect(screen.getByLabelText('Dexterity')).toBeChecked();
      expect(screen.getByLabelText('Intelligence')).not.toBeChecked();
    });

    it('allows updating skill with new attribute links', async () => {
      const user = renderAndSetup({editProps});
      
      await user.clear(screen.getByDisplayValue('Swordsmanship'));
      await user.type(screen.getByLabelText(/skill name/i), 'Advanced Swordsmanship');
      
      await user.click(screen.getByLabelText('Intelligence')); // Add Intelligence
      await user.click(screen.getByLabelText('Dexterity')); // Remove Dexterity
      
      await user.click(screen.getByRole('button', { name: /save changes/i }));
      
      expect(mockProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'skill-1',
          name: 'Advanced Swordsmanship',
          attributeIds: ['attr-1', 'attr-2'], // Strength + Intelligence
        })
      );
    });

    it('handles delete confirmation dialog flow', async () => {
      const user = renderAndSetup({editProps});
      await user.click(screen.getByRole('button', { name: /delete skill/i }));
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('cancel-delete'));
      expect(editProps.onDelete).not.toHaveBeenCalled();
      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /delete skill/i }));
      await user.click(screen.getByTestId('confirm-delete'));
      expect(editProps.onDelete).toHaveBeenCalledWith('skill-1');
    });
  });

  describe('Validation', () => {
    it('validates skill name length limits', async () => {
      const user = renderAndSetup();
      
      const longName = 'a'.repeat(101);
      await user.type(screen.getByLabelText(/skill name/i), longName);
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/skill name must be 100 characters or less/i)).toBeInTheDocument();
    });

    it('validates description length limits', async () => {
      const user = renderAndSetup();
      
      await user.type(screen.getByLabelText(/skill name/i), 'Valid Name');
      
      const longDescription = 'a'.repeat(501);
      await user.type(screen.getByLabelText(/description/i), longDescription);
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/description must be 500 characters or less/i)).toBeInTheDocument();
    });

    it('trims whitespace from inputs', async () => {
      const user = renderAndSetup();
      
      await fillSkillForm(user, '  Swimming  ', '  Water-based movement  ', ['Strength']);
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(mockProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Swimming',
          description: 'Water-based movement',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('displays multiple validation errors', async () => {
      const user = renderAndSetup();
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/skill name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one attribute must be selected/i)).toBeInTheDocument();
    });

    it('clears errors when valid input is provided', async () => {
      const user = renderAndSetup();
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      expect(screen.getByText(/skill name is required/i)).toBeInTheDocument();
      
      await user.type(screen.getByLabelText(/skill name/i), 'Valid Name');
      
      await waitFor(() => {
        expect(screen.queryByText(/skill name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = renderAndSetup();
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('does not save when canceling after making changes', async () => {
      const user = renderAndSetup();
      
      await user.type(screen.getByLabelText(/skill name/i), 'Test Skill');
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(mockProps.onSave).not.toHaveBeenCalled();
      expect(mockProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and structure', () => {
      render(<SkillEditor {...mockProps} />);
      
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/skill name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      
      mockAttributes.forEach(attr => {
        expect(screen.getByLabelText(attr.name)).toBeInTheDocument();
      });
    });

    it('displays error messages with proper ARIA attributes', async () => {
      const user = renderAndSetup();
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      const errorMessages = screen.getAllByRole('alert');
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });
});