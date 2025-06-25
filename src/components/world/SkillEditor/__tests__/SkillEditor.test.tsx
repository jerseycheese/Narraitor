import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillEditor } from '../SkillEditor';
import { WorldSkill, WorldAttribute } from '@/types/world.types';

// Mock the hooks with realistic behavior
jest.mock('@/hooks', () => {
  return {
    useFormState: jest.fn(),
    useModal: jest.fn()
  };
});

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
const mockAttributes: WorldAttribute[] = [
  {
    id: 'attr-1',
    name: 'Strength',
    description: 'Physical power',
    worldId: mockWorldId,
    baseValue: 8,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-2', 
    name: 'Intelligence',
    description: 'Mental ability',
    worldId: mockWorldId,
    baseValue: 7,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-3',
    name: 'Dexterity',
    description: 'Agility and precision',
    worldId: mockWorldId,
    baseValue: 6,
    minValue: 1,
    maxValue: 10,
  },
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

describe('SkillEditor', () => {
  let mockFormData: any;
  let mockFormState: any;
  let mockModalState: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize form data
    mockFormData = {
      name: '',
      description: '',
      attributeIds: [] as string[],
      difficulty: 'medium',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
    };
    
    let formErrors: string[] = [];
    
    // Set up form state mock
    mockFormState = {
      data: mockFormData,
      updateField: jest.fn((field: string, value: any) => {
        mockFormData[field] = value;
        formErrors = [];
      }),
      setData: jest.fn((newData: any) => {
        Object.assign(mockFormData, newData);
      }),
      get errors() { return formErrors; },
      get hasErrors() { return formErrors.length > 0; },
      validate: jest.fn(() => formErrors),
      isValid: jest.fn(() => formErrors.length === 0),
      setErrors: jest.fn((errors: string[]) => {
        formErrors = errors;
      }),
      clearErrors: jest.fn(() => {
        formErrors = [];
      }),
      reset: jest.fn()
    };
    
    // Set up modal state mock
    mockModalState = {
      isOpen: false,
      open: jest.fn(),
      close: jest.fn(),
      modalProps: {
        isOpen: false,
        onClose: jest.fn()
      }
    };
    
    // Apply mocks
    const mockUseFormState = require('@/hooks').useFormState;
    const mockUseModal = require('@/hooks').useModal;
    
    mockUseFormState.mockReturnValue(mockFormState);
    mockUseModal.mockReturnValue(mockModalState);
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
      const user = userEvent.setup();
      
      // Set up successful form submission
      mockFormData.name = 'Acrobatics';
      mockFormData.description = 'Tumbling and gymnastics';
      mockFormData.attributeIds = ['attr-1', 'attr-3'];
      
      mockFormState.isValid.mockReturnValue(true);
      
      render(<SkillEditor {...mockProps} />);
      
      // Submit form
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
      const user = userEvent.setup();
      
      // Set up duplicate name validation
      mockFormData.name = 'Swordsmanship';
      mockFormData.description = 'Test description';
      mockFormData.attributeIds = ['attr-1'];
      
      mockFormState.isValid.mockReturnValue(false);
      mockFormState.setErrors(['Skill name "Swordsmanship" already exists']);
      
      render(<SkillEditor {...mockProps} />);
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/skill name "Swordsmanship" already exists/i)).toBeInTheDocument();
      expect(mockProps.onSave).not.toHaveBeenCalled();
    });

    it('requires at least one attribute to be selected', async () => {
      const user = userEvent.setup();
      
      // Set up missing attributes validation
      mockFormData.name = 'New Skill';
      mockFormData.description = 'Test description';
      mockFormData.attributeIds = [];
      
      mockFormState.isValid.mockReturnValue(false);
      mockFormState.setErrors(['At least one attribute must be selected']);
      
      render(<SkillEditor {...mockProps} />);
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/at least one attribute must be selected/i)).toBeInTheDocument();
      expect(mockProps.onSave).not.toHaveBeenCalled();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      
      // Set up empty required fields
      mockFormData.name = '';
      mockFormData.description = '';
      mockFormData.attributeIds = [];
      
      mockFormState.isValid.mockReturnValue(false);
      mockFormState.setErrors([
        'Skill name is required',
        'Description is required',
        'At least one attribute must be selected'
      ]);
      
      render(<SkillEditor {...mockProps} />);
      
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
        difficulty: 'easy',
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
      // Set up edit mode with existing skill data
      Object.assign(mockFormData, {
        name: 'Swordsmanship',
        description: 'Combat with bladed weapons',
        attributeIds: ['attr-1', 'attr-3'], // Strength and Dexterity
        difficulty: 'medium',
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
      });
      
      render(<SkillEditor {...editProps} />);
      
      expect(screen.getByDisplayValue('Swordsmanship')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Combat with bladed weapons')).toBeInTheDocument();
      
      // Check that linked attributes are selected
      expect(screen.getByLabelText('Strength')).toBeChecked();
      expect(screen.getByLabelText('Dexterity')).toBeChecked();
      expect(screen.getByLabelText('Intelligence')).not.toBeChecked();
    });

    it('allows updating skill with new attribute links', async () => {
      const user = userEvent.setup();
      
      // Start with existing skill data (to simulate useEffect loading)
      Object.assign(mockFormData, {
        name: 'Swordsmanship',
        description: 'Combat with bladed weapons',
        attributeIds: ['attr-1', 'attr-3'], // Original attributes
        difficulty: 'medium',
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
      });
      
      mockFormState.isValid.mockReturnValue(true);
      
      render(<SkillEditor {...editProps} />);
      
      // Simulate user updating the form data
      Object.assign(mockFormData, {
        name: 'Advanced Swordsmanship',
        attributeIds: ['attr-1', 'attr-2'], // Updated attributes
      });
      
      await user.click(screen.getByRole('button', { name: /save changes/i }));
      
      expect(mockProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'skill-1',
          name: 'Advanced Swordsmanship',
          attributeIds: ['attr-1', 'attr-2'], // Strength + Intelligence
        })
      );
    });

    it('shows delete confirmation dialog', async () => {
      const user = userEvent.setup();
      
      // Set up modal to respond to open calls
      mockModalState.open.mockImplementation(() => {
        mockModalState.isOpen = true;
        mockModalState.modalProps.isOpen = true;
      });
      
      render(<SkillEditor {...editProps} />);
      
      await user.click(screen.getByRole('button', { name: /delete skill/i }));
      
      expect(mockModalState.open).toHaveBeenCalled();
    });

    it('handles delete confirmation', async () => {
      const user = userEvent.setup();
      
      // Set up modal to be open after delete button click
      mockModalState.open.mockImplementation(() => {
        mockModalState.isOpen = true;
        mockModalState.modalProps.isOpen = true;
      });
      
      render(<SkillEditor {...editProps} />);
      
      await user.click(screen.getByRole('button', { name: /delete skill/i }));
      
      // Mock the modal being open to show delete dialog
      mockModalState.isOpen = true;
      mockModalState.modalProps.isOpen = true;
      
      // Re-render with modal open to show the delete confirmation dialog
      render(<SkillEditor {...editProps} />);
      
      await user.click(screen.getByTestId('confirm-delete'));
      
      expect(editProps.onDelete).toHaveBeenCalledWith('skill-1');
    });

    it('cancels delete when dialog is cancelled', async () => {
      const user = userEvent.setup();
      
      // Set up modal to be initially open
      mockModalState.isOpen = true;
      mockModalState.modalProps.isOpen = true;
      
      render(<SkillEditor {...editProps} />);
      
      // Simulate cancel action
      await user.click(screen.getByTestId('cancel-delete'));
      
      expect(editProps.onDelete).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('validates skill name length limits', async () => {
      const user = userEvent.setup();
      
      // Set up name too long validation
      const longName = 'a'.repeat(101);
      mockFormData.name = longName;
      mockFormData.description = 'Valid description';
      mockFormData.attributeIds = ['attr-1'];
      
      mockFormState.isValid.mockReturnValue(false);
      mockFormState.setErrors(['Skill name must be 100 characters or less']);
      
      render(<SkillEditor {...mockProps} />);
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/skill name must be 100 characters or less/i)).toBeInTheDocument();
    });

    it('validates description length limits', async () => {
      const user = userEvent.setup();
      
      // Set up description too long validation
      const longDescription = 'a'.repeat(501);
      mockFormData.name = 'Valid Name';
      mockFormData.description = longDescription;
      mockFormData.attributeIds = ['attr-1'];
      
      mockFormState.isValid.mockReturnValue(false);
      mockFormState.setErrors(['Description must be 500 characters or less']);
      
      render(<SkillEditor {...mockProps} />);
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/description must be 500 characters or less/i)).toBeInTheDocument();
    });

    it('trims whitespace from inputs', async () => {
      const user = userEvent.setup();
      
      // Set up whitespace inputs (component will trim when saving)
      mockFormData.name = '  Swimming  ';
      mockFormData.description = '  Water-based movement  ';
      mockFormData.attributeIds = ['attr-1'];
      
      mockFormState.isValid.mockReturnValue(true);
      
      render(<SkillEditor {...mockProps} />);
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      // Component should trim whitespace when saving
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
      const user = userEvent.setup();
      
      // Set up multiple validation errors
      mockFormData.name = '';
      mockFormData.description = '';
      mockFormData.attributeIds = [];
      
      mockFormState.isValid.mockReturnValue(false);
      mockFormState.setErrors([
        'Skill name is required',
        'Description is required',
        'At least one attribute must be selected'
      ]);
      
      render(<SkillEditor {...mockProps} />);
      
      // Submit empty form
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      expect(screen.getByText(/skill name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one attribute must be selected/i)).toBeInTheDocument();
    });

    it('clears errors when valid input is provided', async () => {
      const user = userEvent.setup();
      
      // Start with errors
      mockFormState.setErrors(['Skill name is required']);
      
      render(<SkillEditor {...mockProps} />);
      
      expect(screen.getByText(/skill name is required/i)).toBeInTheDocument();
      
      // Simulate field update clearing errors
      mockFormState.updateField.mockImplementation((field, value) => {
        mockFormData[field] = value;
        mockFormState.clearErrors();
      });
      
      // Fix the error
      await user.type(screen.getByLabelText(/skill name/i), 'Valid Name');
      
      // Error should be cleared
      // Check that error is cleared (updateField mock clears errors)
      expect(mockFormState.clearErrors).toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<SkillEditor {...mockProps} />);
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('does not save when canceling after making changes', async () => {
      const user = userEvent.setup();
      render(<SkillEditor {...mockProps} />);
      
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
      const user = userEvent.setup();
      
      // Set up validation errors
      mockFormState.isValid.mockReturnValue(false);
      mockFormState.setErrors(['Skill name is required']);
      
      render(<SkillEditor {...mockProps} />);
      
      await user.click(screen.getByRole('button', { name: /create skill/i }));
      
      const errorMessages = screen.getAllByRole('alert');
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });
});