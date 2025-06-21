import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuidedFirstTimeExperience } from './GuidedFirstTimeExperience';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldStore } from '@/state/worldStore';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/sessionStore');
jest.mock('@/state/worldStore');

// Mock wizard components and hooks
jest.mock('@/components/shared/wizard/WizardContainer', () => ({
  WizardContainer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="wizard-container">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock('@/components/shared/wizard/WizardProgress', () => ({
  WizardProgress: ({ steps, currentStep }: { steps: unknown[]; currentStep: number }) => (
    <div data-testid="wizard-progress">
      Step {currentStep + 1} of {steps.length}
    </div>
  ),
}));

jest.mock('@/components/shared/wizard/hooks/useWizardState', () => ({
  useWizardState: jest.fn(),
}));

jest.mock('@/components/shared/wizard/utils/validation', () => ({
  validators: {
    required: (value: string, field: string) => value ? null : `${field} is required`,
  },
  validateField: jest.fn(),
}));

import { useWizardState } from '@/components/shared/wizard/hooks/useWizardState';
import { validateField } from '@/components/shared/wizard/utils/validation';

describe('GuidedFirstTimeExperience', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };
  const mockSetOnboardingCompleted = jest.fn();
  const mockCreateWorld = jest.fn().mockReturnValue('mock-world-id');
  const mockSetCurrentWorld = jest.fn();
  const mockHandleComplete = jest.fn();
  const mockHandleNext = jest.fn();
  const mockHandleBack = jest.fn();
  const mockHandleCancel = jest.fn();
  const mockUpdateData = jest.fn();

  const mockWizardState = {
    currentStep: 0,
    data: { 
      name: '', 
      genre: 'fantasy', 
      worldTypeData: {
        worldType: 'original' as const,
        worldReference: '',
        additionalDetails: ''
      }
    },
    isProcessing: false,
    errors: {},
    validation: {},
  };

  const mockWizard = {
    currentStep: 0,
    isFirstStep: true,
    isLastStep: false,
    canGoNext: true,
    canGoBack: false,
    state: mockWizardState,
    stepValidation: { valid: true, errors: [], touched: false },
    currentError: null,
    handlers: {
      handleComplete: mockHandleComplete,
      handleNext: mockHandleNext,
      handleBack: mockHandleBack,
      handleCancel: mockHandleCancel,
      updateData: mockUpdateData,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (validateField as jest.Mock).mockReturnValue(null);
    
    // Mock useSessionStore
    (useSessionStore as unknown as jest.Mock).mockReturnValue({
      setOnboardingCompleted: mockSetOnboardingCompleted,
      shouldShowOnboarding: jest.fn().mockReturnValue(true),
    });

    // Mock useWorldStore 
    (useWorldStore as unknown as jest.Mock).mockReturnValue({
      createWorld: mockCreateWorld,
      setCurrentWorld: mockSetCurrentWorld,
    });

    // Mock useWizardState
    (useWizardState as jest.Mock).mockReturnValue(mockWizard);
  });

  describe('Component rendering', () => {
    it('renders when onboarding should be shown', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByTestId('wizard-container')).toBeInTheDocument();
      expect(screen.getByText('First time?')).toBeInTheDocument();
      expect(screen.getByText('Quick start:')).toBeInTheDocument();
    });

    it('does not render when onboarding should not be shown', () => {
      (useSessionStore as unknown as jest.Mock).mockReturnValue({
        setOnboardingCompleted: mockSetOnboardingCompleted,
        shouldShowOnboarding: jest.fn().mockReturnValue(false),
      });

      const { container } = render(<GuidedFirstTimeExperience />);
      expect(container.firstChild).toBeNull();
    });

    it('displays wizard progress', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByTestId('wizard-progress')).toBeInTheDocument();
      expect(screen.getAllByText('Step 1 of 3')).toHaveLength(2); // Both in progress and step indicator
    });
  });

  describe('Welcome step (Step 0)', () => {
    it('displays welcome message and value proposition', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByText(/create a world and start a story/i)).toBeInTheDocument();
      expect(screen.getByText(/guide you through creating your first world/i)).toBeInTheDocument();
      expect(screen.getByText(/2 steps, then create your character/i)).toBeInTheDocument();
    });

    it('shows skip and next buttons', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('calls handleNext when next button is clicked', () => {
      render(<GuidedFirstTimeExperience />);
      
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      expect(mockHandleNext).toHaveBeenCalled();
    });

    it('calls handleCancel when skip button is clicked', () => {
      render(<GuidedFirstTimeExperience />);
      
      fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      expect(mockHandleCancel).toHaveBeenCalled();
    });
  });

  describe('World Concept step (Step 1)', () => {
    beforeEach(() => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 1,
        isFirstStep: false,
        canGoBack: true,
      });
    });

    it('displays world concept form', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByText(/world concept/i)).toBeInTheDocument();
      expect(screen.getByText(/create an rpg in any fictional universe/i)).toBeInTheDocument();
      // Component now uses WorldTypeSelector with radio buttons instead of textbox
      expect(screen.getByDisplayValue('original')).toBeInTheDocument();
    });

    it('shows back and next buttons', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('updates data when world type changes', () => {
      render(<GuidedFirstTimeExperience />);
      
      const inspiredByOption = screen.getByRole('radio', { name: /inspired by/i });
      fireEvent.click(inspiredByOption);
      
      expect(mockUpdateData).toHaveBeenCalledWith({
        worldTypeData: expect.objectContaining({
          worldType: 'inspired_by'
        })
      });
    });

    it('displays world concept step with world type selector', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 1,
        state: {
          ...mockWizardState,
          data: { 
            ...mockWizardState.data, 
            worldTypeData: {
              worldType: 'inspired_by',
              worldReference: 'Star Wars',
              additionalDetails: 'A magical forest'
            }
          },
        },
      });

      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByText(/world concept/i)).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /inspired by/i })).toBeChecked();
    });
  });

  describe('World Details step (Step 2)', () => {
    beforeEach(() => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 2,
        isFirstStep: false,
        canGoBack: true,
      });
    });

    it('displays world details form', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByText(/world details/i)).toBeInTheDocument();
      expect(screen.getByText(/give your world a name and genre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/world name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
    });

    it('updates name when input changes', () => {
      render(<GuidedFirstTimeExperience />);
      
      const nameInput = screen.getByLabelText(/world name/i);
      fireEvent.change(nameInput, { target: { value: 'Mystic Realm' } });
      
      expect(mockUpdateData).toHaveBeenCalledWith({ name: 'Mystic Realm' });
    });

    it('updates genre when option changes', () => {
      render(<GuidedFirstTimeExperience />);
      
      // Test genre selection 
      const genreSelect = screen.getByLabelText(/genre/i);
      fireEvent.change(genreSelect, { target: { value: 'sci-fi' } });
      
      expect(mockUpdateData).toHaveBeenCalledWith({
        genre: 'sci-fi'
      });
    });

    it('shows genre selection dropdown', () => {
      render(<GuidedFirstTimeExperience />);
      
      // Check that genre dropdown works
      const genreSelect = screen.getByLabelText(/genre/i);
      expect(genreSelect).toBeInTheDocument();
      expect(genreSelect.tagName.toLowerCase()).toBe('select');
    });

    it('displays validation errors when present', () => {
      const validationErrors = ['World name is required', 'Genre is required'];
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 2,
        stepValidation: {
          valid: false,
          errors: validationErrors,
          touched: true,
        },
      });

      render(<GuidedFirstTimeExperience />);
      
      validationErrors.forEach(error => {
        expect(screen.getByText(error)).toBeInTheDocument();
      });
    });

    it('hides genre field for "Set Within" world types', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 2,
        state: {
          ...mockWizardState,
          data: { 
            ...mockWizardState.data, 
            worldTypeData: {
              worldType: 'set_within',
              worldReference: 'Star Wars',
              additionalDetails: 'During the Clone Wars'
            }
          },
        },
      });

      render(<GuidedFirstTimeExperience />);
      
      // Should show modified text indicating genre will be auto-detected
      expect(screen.getByText(/genre will be automatically detected/i)).toBeInTheDocument();
      
      // Should NOT show genre field at all
      expect(screen.queryByLabelText(/genre/i)).not.toBeInTheDocument();
      expect(screen.queryByText('*')).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('shows genre field for original and inspired by world types', () => {
      // Test original world type
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 2,
        state: {
          ...mockWizardState,
          data: { 
            ...mockWizardState.data, 
            worldTypeData: {
              worldType: 'original',
              worldReference: '',
              additionalDetails: ''
            }
          },
        },
      });

      render(<GuidedFirstTimeExperience />);
      
      // Should show standard text and genre field with required asterisk
      expect(screen.getByText(/give your world a name and genre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Final step completion', () => {
    beforeEach(() => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 2,
        isLastStep: true,
        stepValidation: { valid: true, errors: [], touched: true },
      });
    });

    it('shows "Create World" button on final step', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByRole('button', { name: /create world/i })).toBeInTheDocument();
    });

    it('calls handleComplete when "Create World" is clicked', () => {
      render(<GuidedFirstTimeExperience />);
      
      fireEvent.click(screen.getByRole('button', { name: /create world/i }));
      expect(mockHandleComplete).toHaveBeenCalled();
    });

    it('disables "Create World" button when validation fails', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 2,
        isLastStep: true,
        stepValidation: { valid: false, errors: ['Name required'], touched: true },
      });

      render(<GuidedFirstTimeExperience />);
      
      const button = screen.getByRole('button', { name: /create world/i });
      expect(button).toBeDisabled();
    });

    it('shows processing state when creating world', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 2,
        isLastStep: true,
        state: { ...mockWizardState, isProcessing: true },
      });

      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByText('Creating world...')).toBeInTheDocument();
    });

    it('completes world creation successfully when all fields are filled', async () => {
      // Set up wizard with complete data
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 2,
        isLastStep: true,
        stepValidation: { valid: true, errors: [], touched: true },
        state: {
          ...mockWizardState,
          data: {
            name: 'Test World',
            genre: 'western',
            worldTypeData: {
              worldType: 'original',
              worldReference: '',
              additionalDetails: 'A frontier town'
            }
          }
        }
      });

      render(<GuidedFirstTimeExperience />);
      
      // Should show create button enabled
      const createButton = screen.getByRole('button', { name: /create world/i });
      expect(createButton).toBeEnabled();
      
      // Clicking should call completion handler
      fireEvent.click(createButton);
      expect(mockHandleComplete).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('displays error message when present', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentError: 'Failed to create world',
      });

      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByText('Failed to create world')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('hides back button on first step', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    it('shows back button on non-first steps', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 1,
        isFirstStep: false,
        canGoBack: true,
      });

      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('calls handleBack when back button is clicked', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 1,
        isFirstStep: false,
        canGoBack: true,
      });

      render(<GuidedFirstTimeExperience />);
      
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(mockHandleBack).toHaveBeenCalled();
    });
  });

  describe('Button states', () => {
    it('disables next button when validation fails', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        stepValidation: { valid: false, errors: ['Required'], touched: true },
      });

      render(<GuidedFirstTimeExperience />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('enables next button when validation passes', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        stepValidation: { valid: true, errors: [], touched: true },
      });

      render(<GuidedFirstTimeExperience />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });
  });
});