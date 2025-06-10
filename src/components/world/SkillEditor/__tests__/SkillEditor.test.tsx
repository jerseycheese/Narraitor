import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillEditor } from '../SkillEditor';
import { WorldSkill, WorldAttribute } from '@/types/world.types';
import { EntityID } from '@/types/common.types';

describe('SkillEditor - TDD Comprehensive Tests', () => {
  const mockWorldId = 'world-123' as EntityID;
  const mockSkillId = 'skill-456' as EntityID;
  
  const mockAttributes: WorldAttribute[] = [
    {
      id: 'attr-1' as EntityID,
      worldId: mockWorldId,
      name: 'Strength',
      description: 'Physical power',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
    },
    {
      id: 'attr-2' as EntityID,
      worldId: mockWorldId,
      name: 'Intelligence',
      description: 'Mental acuity',
      baseValue: 12,
      minValue: 1,
      maxValue: 20,
    },
    {
      id: 'attr-3' as EntityID,
      worldId: mockWorldId,
      name: 'Dexterity',
      description: 'Agility and reflexes',
      baseValue: 14,
      minValue: 1,
      maxValue: 20,
    },
  ];

  const mockExistingSkills: WorldSkill[] = [
    {
      id: 'existing-skill-1' as EntityID,
      worldId: mockWorldId,
      name: 'Athletics',
      description: 'Physical prowess and endurance',
      attributeIds: ['attr-1'],
      difficulty: 'medium',
      baseValue: 3,
      minValue: 1,
      maxValue: 5,
    },
  ];

  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode - Basic Functionality', () => {
    test('renders create mode form with all required fields', () => {
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      // Check form title
      expect(screen.getByText('Create New Skill')).toBeInTheDocument();

      // Check all form fields are present
      expect(screen.getByLabelText(/skill name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/minimum value/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum value/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/base value/i)).toBeInTheDocument();

      // Check linked attributes section
      expect(screen.getByText(/linked attributes/i)).toBeInTheDocument();
      mockAttributes.forEach(attr => {
        expect(screen.getByText(attr.name)).toBeInTheDocument();
      });

      // Check action buttons
      expect(screen.getByText('Create Skill')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('allows user to input skill data', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      // Input skill name
      const nameInput = screen.getByLabelText(/skill name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Investigation');
      expect(nameInput).toHaveValue('Investigation');

      // Input description
      const descInput = screen.getByLabelText(/description/i);
      await user.clear(descInput);
      await user.type(descInput, 'Finding clues and solving mysteries');
      expect(descInput).toHaveValue('Finding clues and solving mysteries');

      // Input category
      const categoryInput = screen.getByLabelText(/category/i);
      await user.clear(categoryInput);
      await user.type(categoryInput, 'Mental');
      expect(categoryInput).toHaveValue('Mental');
    });

    test('allows selecting multiple attributes via checkboxes', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      // Check multiple attributes
      const strengthCheckbox = screen.getByRole('checkbox', { name: /strength/i });
      const intelligenceCheckbox = screen.getByRole('checkbox', { name: /intelligence/i });
      
      await user.click(strengthCheckbox);
      await user.click(intelligenceCheckbox);
      
      expect(strengthCheckbox).toBeChecked();
      expect(intelligenceCheckbox).toBeChecked();
    });

    test('validates required fields before saving', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      // Try to save without filling required fields
      const saveButton = screen.getByText('Create Skill');
      await user.click(saveButton);

      // Should show validation errors
      expect(screen.getByText(/skill name is required/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('prevents duplicate skill names', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      // Input duplicate name
      const nameInput = screen.getByLabelText(/skill name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Athletics'); // Existing skill name

      const saveButton = screen.getByText('Create Skill');
      await user.click(saveButton);

      // Should show duplicate error
      expect(screen.getByText(/skill with this name already exists/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('validates value ranges (min < max)', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      // Set invalid range (min >= max)
      const minInput = screen.getByLabelText(/minimum value/i);
      const maxInput = screen.getByLabelText(/maximum value/i);
      
      await user.clear(minInput);
      await user.type(minInput, '5');
      await user.clear(maxInput);
      await user.type(maxInput, '3');

      // Fill required name field
      const nameInput = screen.getByLabelText(/skill name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Test Skill');

      const saveButton = screen.getByText('Create Skill');
      await user.click(saveButton);

      // Should show range validation error
      expect(screen.getByText(/maximum value must be greater than minimum value/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('saves valid skill with multiple attributes', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      // Fill form with valid data
      const nameInput = screen.getByLabelText(/skill name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Investigation');

      const descInput = screen.getByLabelText(/description/i);
      await user.clear(descInput);
      await user.type(descInput, 'Finding clues');

      // Select multiple attributes
      const strengthCheckbox = screen.getByRole('checkbox', { name: /strength/i });
      const intelligenceCheckbox = screen.getByRole('checkbox', { name: /intelligence/i });
      await user.click(strengthCheckbox);
      await user.click(intelligenceCheckbox);

      // Save
      const saveButton = screen.getByText('Create Skill');
      await user.click(saveButton);

      // Should call onSave with correct data
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Investigation',
          description: 'Finding clues',
          attributeIds: ['attr-1', 'attr-2'],
          worldId: mockWorldId,
        })
      );
    });

    test('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Edit Mode - Existing Skill Functionality', () => {
    const existingSkill: WorldSkill = {
      id: mockSkillId,
      worldId: mockWorldId,
      name: 'Existing Skill',
      description: 'An existing skill for testing',
      attributeIds: ['attr-1', 'attr-3'],
      difficulty: 'hard',
      category: 'Combat',
      baseValue: 4,
      minValue: 1,
      maxValue: 5,
    };

    test('renders edit mode with populated fields', () => {
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="edit"
          skillId={mockSkillId}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={[...mockExistingSkills, existingSkill]}
        />
      );

      // Check form title
      expect(screen.getByText('Edit Skill')).toBeInTheDocument();

      // Check fields are populated
      expect(screen.getByDisplayValue('Existing Skill')).toBeInTheDocument();
      expect(screen.getByDisplayValue('An existing skill for testing')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Combat')).toBeInTheDocument();

      // Check attributes are pre-selected
      const strengthCheckbox = screen.getByRole('checkbox', { name: /strength/i });
      const dexterityCheckbox = screen.getByRole('checkbox', { name: /dexterity/i });
      const intelligenceCheckbox = screen.getByRole('checkbox', { name: /intelligence/i });
      
      expect(strengthCheckbox).toBeChecked(); // attr-1
      expect(dexterityCheckbox).toBeChecked(); // attr-3
      expect(intelligenceCheckbox).not.toBeChecked(); // not selected

      // Check action buttons
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Delete Skill')).toBeInTheDocument();
    });

    test('shows delete confirmation dialog with linked attributes warning', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="edit"
          skillId={mockSkillId}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={[...mockExistingSkills, existingSkill]}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete skill/i });
      await user.click(deleteButton);

      // Should show delete confirmation dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /delete skill/i })).toBeInTheDocument();
      expect(screen.getByText(/linked to.*attributes/i)).toBeInTheDocument();
    });

    test('confirms skill deletion', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="edit"
          skillId={mockSkillId}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={[...mockExistingSkills, existingSkill]}
        />
      );

      // Open delete dialog
      const deleteButton = screen.getByRole('button', { name: /delete skill/i });
      await user.click(deleteButton);

      // Confirm deletion - find the button within the dialog
      const dialog = screen.getByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: /delete skill/i });
      await user.click(confirmButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockSkillId);
    });

    test('updates existing skill data', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="edit"
          skillId={mockSkillId}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={[...mockExistingSkills, existingSkill]}
        />
      );

      // Modify skill name
      const nameInput = screen.getByDisplayValue('Existing Skill');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Skill');

      // Change attribute selection
      const intelligenceCheckbox = screen.getByRole('checkbox', { name: /intelligence/i });
      await user.click(intelligenceCheckbox);

      // Save changes
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockSkillId,
          name: 'Updated Skill',
          attributeIds: expect.arrayContaining(['attr-1', 'attr-3', 'attr-2']),
        })
      );
    });
  });

  describe('Multi-Attribute Selection UI', () => {
    test('displays all available attributes as checkboxes', () => {
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      mockAttributes.forEach(attribute => {
        const checkbox = screen.getByRole('checkbox', { name: new RegExp(attribute.name, 'i') });
        expect(checkbox).toBeInTheDocument();
        expect(screen.getByText(attribute.description)).toBeInTheDocument();
      });
    });

    test('allows selecting and deselecting multiple attributes', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      const strengthCheckbox = screen.getByRole('checkbox', { name: /strength/i });
      const intelligenceCheckbox = screen.getByRole('checkbox', { name: /intelligence/i });
      const dexterityCheckbox = screen.getByRole('checkbox', { name: /dexterity/i });

      // Select multiple attributes
      await user.click(strengthCheckbox);
      await user.click(intelligenceCheckbox);
      
      expect(strengthCheckbox).toBeChecked();
      expect(intelligenceCheckbox).toBeChecked();
      expect(dexterityCheckbox).not.toBeChecked();

      // Deselect one
      await user.click(strengthCheckbox);
      expect(strengthCheckbox).not.toBeChecked();
      expect(intelligenceCheckbox).toBeChecked();
    });

    test('handles empty attributes list gracefully', () => {
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={[]}
          existingSkills={mockExistingSkills}
        />
      );

      expect(screen.getByText(/no attributes available/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('clears validation errors when user starts typing', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      // Trigger validation error
      const saveButton = screen.getByText('Create Skill');
      await user.click(saveButton);
      expect(screen.getByText(/skill name is required/i)).toBeInTheDocument();

      // Start typing to clear error
      const nameInput = screen.getByLabelText(/skill name/i);
      await user.type(nameInput, 'New Skill');

      expect(screen.queryByText(/skill name is required/i)).not.toBeInTheDocument();
    });

    test('handles missing skillId in edit mode gracefully', () => {
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="edit"
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockExistingSkills}
        />
      );

      // Should still render form but with empty fields
      expect(screen.getByText('Edit Skill')).toBeInTheDocument();
      expect(screen.getByLabelText(/skill name/i)).toHaveValue('');
    });

    test('enforces maximum attributes limit if applicable (up to 12 total skills)', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={Array(11).fill(null).map((_, i) => ({
            ...mockExistingSkills[0],
            id: `skill-${i}` as EntityID,
            name: `Skill ${i}`,
          }))}
        />
      );

      // Fill form
      const nameInput = screen.getByLabelText(/skill name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Last Skill');

      const saveButton = screen.getByText('Create Skill');
      await user.click(saveButton);

      // Should allow creation (12th skill)
      expect(mockOnSave).toHaveBeenCalled();
    });

    test('prevents creating more than 12 skills total', async () => {
      const user = userEvent.setup();
      
      render(
        <SkillEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={Array(12).fill(null).map((_, i) => ({
            ...mockExistingSkills[0],
            id: `skill-${i}` as EntityID,
            name: `Skill ${i}`,
          }))}
        />
      );

      // Try to add 13th skill
      const nameInput = screen.getByLabelText(/skill name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Too Many Skills');

      const saveButton = screen.getByText('Create Skill');
      await user.click(saveButton);

      // Should show limit error
      expect(screen.getByText(/cannot create more than 12 skills/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
});