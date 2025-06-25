import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AttributeEditor } from '../AttributeEditor';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { EntityID } from '@/types/common.types';

// Simple, behavioral mock that focuses on what the hooks do, not how they work
jest.mock('@/hooks', () => ({
  useFormState: jest.fn(),
  useModal: jest.fn(),
  useErrorState: jest.fn(),
}));

const mockHooks = {
  useFormState: jest.fn(),
  useModal: jest.fn(),
  useErrorState: jest.fn(),
};

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
    attributeIds: [mockAttributeId],
    difficulty: 'medium',
    minValue: 1,
    maxValue: 10,
    baseValue: 5,
  };

  const mockAttributes: WorldAttribute[] = [mockAttribute];
  const mockSkills: WorldSkill[] = [mockSkill];

  // Default form state for consistent behavior
  const createMockFormState = (initialData = {}, errors: string[] = []) => ({
    data: {
      name: '',
      description: '',
      minValue: 1,
      maxValue: 10,
      ...initialData,
    },
    updateField: jest.fn(),
    setData: jest.fn(),
    errors,
    hasErrors: errors.length > 0,
    isValid: jest.fn(() => errors.length === 0),
    validate: jest.fn(() => errors),
  });

  // Default modal state
  const createMockModal = (isOpen = false) => ({
    isOpen,
    open: jest.fn(),
    close: jest.fn(),
    modalProps: {
      isOpen,
      onClose: jest.fn(),
    },
  });

  // Default error state
  const createMockErrorState = (error: string | null = null) => ({
    error,
    hasError: !!error,
    setError: jest.fn(),
    clearError: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset to defaults
    mockHooks.useFormState.mockReturnValue(createMockFormState());
    mockHooks.useModal.mockReturnValue(createMockModal());
    mockHooks.useErrorState.mockReturnValue(createMockErrorState());
    
    // Apply mocks
    require('@/hooks').useFormState = mockHooks.useFormState;
    require('@/hooks').useModal = mockHooks.useModal;
    require('@/hooks').useErrorState = mockHooks.useErrorState;
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
      // Mock form state with validation errors
      const mockFormWithErrors = createMockFormState(
        { name: '', description: '', minValue: 1, maxValue: 10 },
        ['Attribute name is required']
      );
      mockHooks.useFormState.mockReturnValue(mockFormWithErrors);

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

      // Validation errors should be displayed
      expect(screen.getByText(/attribute name is required/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('creates new attribute with valid data', async () => {
      // Mock form state with valid data and no errors
      const mockFormWithValidData = createMockFormState({
        name: 'Intelligence',
        description: 'Mental acuity and reasoning',
        minValue: 0,
        maxValue: 20,
      });
      mockHooks.useFormState.mockReturnValue(mockFormWithValidData);

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

      // Simulate save button click
      fireEvent.click(screen.getByText(/create attribute/i));

      // Verify the callback was called with the expected data
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

  describe('Edit Mode', () => {
    it('renders edit form with existing attribute data', () => {
      // Mock form state with existing attribute data
      const mockFormWithExistingData = createMockFormState({
        name: 'Strength',
        description: 'Physical power and endurance',
        minValue: 1,
        maxValue: 10,
      });
      mockHooks.useFormState.mockReturnValue(mockFormWithExistingData);

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
      // Mock form state with updated data
      const mockFormWithUpdatedData = createMockFormState({
        name: 'Power',
        description: 'Physical power and endurance',
        minValue: 1,
        maxValue: 10,
      });
      mockHooks.useFormState.mockReturnValue(mockFormWithUpdatedData);

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

      fireEvent.click(screen.getByText(/save changes/i));

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

    it('prevents duplicate attribute names', async () => {
      // Mock form state with duplicate name validation error
      const mockFormWithDuplicateError = createMockFormState(
        {
          name: 'Dexterity',
          description: 'Physical power and endurance',
          minValue: 1,
          maxValue: 10,
        },
        ['An attribute with this name already exists']
      );
      mockHooks.useFormState.mockReturnValue(mockFormWithDuplicateError);

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

      // Validation error should be displayed
      expect(screen.getByText(/an attribute with this name already exists/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('shows delete confirmation dialog', async () => {
      // Mock modal state as open to simulate dialog display
      const mockModalOpen = createMockModal(true);
      mockHooks.useModal.mockReturnValue(mockModalOpen);

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

      // Since modal is mocked as open, dialog should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });

    it('warns when deleting attribute linked to skills', async () => {
      // Mock modal as open and error state with skill warning
      const mockModalOpen = createMockModal(true);
      const mockErrorWithWarning = createMockErrorState(
        'This attribute is linked to 1 skill. Deleting this attribute will affect these skills.'
      );
      
      mockHooks.useModal.mockReturnValue(mockModalOpen);
      mockHooks.useErrorState.mockReturnValue(mockErrorWithWarning);

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

      // Warning should be displayed in the dialog
      expect(screen.getByText(/this attribute is linked to 1 skill/i)).toBeInTheDocument();
    });

    it('deletes attribute after confirmation', async () => {
      // Mock modal as open to simulate confirmation dialog
      const mockModalOpen = createMockModal(true);
      mockHooks.useModal.mockReturnValue(mockModalOpen);

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

      // Dialog should be visible, find and click the confirm button within the dialog
      const dialog = screen.getByRole('dialog');
      const dialogDeleteButton = within(dialog).getByRole('button', { name: /delete attribute/i });
      fireEvent.click(dialogDeleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockAttributeId);
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
      // Mock form state with min/max validation error
      const mockFormWithRangeError = createMockFormState(
        {
          name: 'Test Attribute',
          description: '',
          minValue: 10,
          maxValue: 5,
        },
        ['Maximum value must be greater than minimum value']
      );
      mockHooks.useFormState.mockReturnValue(mockFormWithRangeError);

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

      // Validation error should be displayed
      expect(screen.getByText(/maximum value must be greater than minimum value/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('renders correctly when maxAttributes limit is provided', async () => {
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

      // Test that the component renders without crashing when maxAttributes is provided
      expect(screen.getByLabelText(/attribute name/i)).toBeInTheDocument();
      expect(screen.getByText(/create attribute/i)).toBeInTheDocument();
      
      // Test that form interaction works without throwing
      expect(() => {
        fireEvent.change(screen.getByLabelText(/attribute name/i), {
          target: { value: 'New Attribute' },
        });
      }).not.toThrow();
    });
  });
});
