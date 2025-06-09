import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AttributeEditor } from '../AttributeEditor';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { EntityID } from '@/types/common.types';

describe('AttributeEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnCancel = jest.fn();

  const mockWorldId = 'world-123' as EntityID;
  const mockAttributeId = 'attr-123' as EntityID;

  const mockAttribute: WorldAttribute = {
    id: mockAttributeId,
    worldId: mockWorldId,
    name: 'Strength',
    description: 'Physical power and endurance',
    minValue: 1,
    maxValue: 10,
    baseValue: 5,
  };

  const mockSkill: WorldSkill = {
    id: 'skill-123' as EntityID,
    worldId: mockWorldId,
    name: 'Athletics',
    description: 'Physical activities',
    linkedAttributeId: mockAttributeId,
    difficulty: 'medium',
    minValue: 1,
    maxValue: 10,
    baseValue: 5,
  };

  const mockAttributes: WorldAttribute[] = [mockAttribute];
  const mockSkills: WorldSkill[] = [mockSkill];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={[]}
          existingSkills={[]}
        />
      );

      expect(screen.getByLabelText(/attribute name/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/minimum value/i)).toHaveValue(1);
      expect(screen.getByLabelText(/maximum value/i)).toHaveValue(10);
      expect(screen.getByText(/create attribute/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={[]}
          existingSkills={[]}
        />
      );

      const saveButton = screen.getByText(/create attribute/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/attribute name is required/i)).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('creates new attribute with valid data', async () => {
      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={[]}
          existingSkills={[]}
        />
      );

      fireEvent.change(screen.getByLabelText(/attribute name/i), {
        target: { value: 'Intelligence' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Mental acuity and reasoning' },
      });
      fireEvent.change(screen.getByLabelText(/minimum value/i), {
        target: { value: '0' },
      });
      fireEvent.change(screen.getByLabelText(/maximum value/i), {
        target: { value: '20' },
      });

      fireEvent.click(screen.getByText(/create attribute/i));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Intelligence',
            description: 'Mental acuity and reasoning',
            minValue: 0,
            maxValue: 20,
            worldId: mockWorldId,
          })
        );
      });
    });
  });

  describe('Edit Mode', () => {
    it('renders edit form with existing attribute data', () => {
      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="edit"
          attributeId={mockAttributeId}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockSkills}
        />
      );

      expect(screen.getByLabelText(/attribute name/i)).toHaveValue('Strength');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Physical power and endurance');
      expect(screen.getByLabelText(/minimum value/i)).toHaveValue(1);
      expect(screen.getByLabelText(/maximum value/i)).toHaveValue(10);
      expect(screen.getByText(/save changes/i)).toBeInTheDocument();
      expect(screen.getByText(/delete attribute/i)).toBeInTheDocument();
    });

    it('updates existing attribute', async () => {
      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="edit"
          attributeId={mockAttributeId}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockSkills}
        />
      );

      fireEvent.change(screen.getByLabelText(/attribute name/i), {
        target: { value: 'Power' },
      });

      fireEvent.click(screen.getByText(/save changes/i));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            id: mockAttributeId,
            name: 'Power',
            description: 'Physical power and endurance',
            minValue: 1,
            maxValue: 10,
          })
        );
      });
    });

    it('prevents duplicate attribute names', async () => {
      const multipleAttributes = [
        mockAttribute,
        {
          id: 'attr-456' as EntityID,
          worldId: mockWorldId,
          name: 'Dexterity',
          description: 'Agility and reflexes',
          minValue: 1,
          maxValue: 10,
          baseValue: 5,
        },
      ];

      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="edit"
          attributeId={mockAttributeId}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={multipleAttributes}
          existingSkills={mockSkills}
        />
      );

      fireEvent.change(screen.getByLabelText(/attribute name/i), {
        target: { value: 'Dexterity' },
      });

      fireEvent.click(screen.getByText(/save changes/i));

      await waitFor(() => {
        expect(screen.getByText(/an attribute with this name already exists/i)).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('shows delete confirmation dialog', async () => {
      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="edit"
          attributeId={mockAttributeId}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockSkills}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete attribute/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      });
    });

    it('warns when deleting attribute linked to skills', async () => {
      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="edit"
          attributeId={mockAttributeId}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={mockSkills}
        />
      );

      fireEvent.click(screen.getByText(/delete attribute/i));

      await waitFor(() => {
        expect(screen.getByText(/this attribute is linked to 1 skill/i)).toBeInTheDocument();
      });
    });

    it('deletes attribute after confirmation', async () => {
      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="edit"
          attributeId={mockAttributeId}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onCancel={mockOnCancel}
          existingAttributes={mockAttributes}
          existingSkills={[]} // No linked skills to avoid warning
        />
      );

      // Click the delete button in the form
      const deleteButton = screen.getByLabelText(/delete attribute/i);
      fireEvent.click(deleteButton);
      
      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Find the confirm button in the dialog and click it
      const dialogDeleteButton = screen.getByRole('dialog').querySelector('button[class*="bg-red-600"]') as HTMLElement;
      fireEvent.click(dialogDeleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(mockAttributeId);
      });
    });
  });

  describe('Common Functionality', () => {
    it('calls onCancel when cancel button is clicked', () => {
      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={[]}
          existingSkills={[]}
        />
      );

      fireEvent.click(screen.getByText(/cancel/i));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('validates min/max value ranges', async () => {
      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={[]}
          existingSkills={[]}
        />
      );

      fireEvent.change(screen.getByLabelText(/attribute name/i), {
        target: { value: 'Test Attribute' },
      });
      fireEvent.change(screen.getByLabelText(/minimum value/i), {
        target: { value: '10' },
      });
      fireEvent.change(screen.getByLabelText(/maximum value/i), {
        target: { value: '5' },
      });

      fireEvent.click(screen.getByText(/create attribute/i));

      await waitFor(() => {
        expect(screen.getByText(/maximum value must be greater than minimum value/i)).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('prevents creation when maxAttributes limit is reached', async () => {
      const twoAttributes: WorldAttribute[] = [
        mockAttribute,
        { ...mockAttribute, id: 'attr-2' as EntityID, name: 'Intelligence' }
      ];

      render(
        <AttributeEditor
          worldId={mockWorldId}
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingAttributes={twoAttributes}
          existingSkills={[]}
          maxAttributes={2}
        />
      );

      fireEvent.change(screen.getByLabelText(/attribute name/i), {
        target: { value: 'New Attribute' },
      });

      fireEvent.click(screen.getByText(/create attribute/i));

      await waitFor(() => {
        expect(screen.getByText(/cannot create more attributes.*maximum of 2/i)).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
});
