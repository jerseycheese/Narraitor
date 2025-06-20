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
    data: { name: '', theme: '', description: '' },
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
      expect(screen.getByText('Get Started')).toBeInTheDocument();
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
      expect(screen.getByText(/3 steps/i)).toBeInTheDocument();
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
      
      expect(screen.getAllByText(/world concept/i)).toHaveLength(2); // Title and label
      expect(screen.getByText(/create an rpg in any fictional universe/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows back and next buttons', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('updates data when textarea changes', () => {
      render(<GuidedFirstTimeExperience />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'A magical forest realm' } });
      
      expect(mockUpdateData).toHaveBeenCalledWith({ description: 'A magical forest realm' });
    });

    it('displays world concept step with description input', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 1,
        state: {
          ...mockWizardState,
          data: { ...mockWizardState.data, description: 'A magical forest' },
        },
      });

      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByLabelText(/world concept/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('A magical forest')).toBeInTheDocument();
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
      expect(screen.getByText(/give your world a name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/world name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/theme/i)).toBeInTheDocument();
    });

    it('updates name when input changes', () => {
      render(<GuidedFirstTimeExperience />);
      
      const nameInput = screen.getByLabelText(/world name/i);
      fireEvent.change(nameInput, { target: { value: 'Mystic Realm' } });
      
      expect(mockUpdateData).toHaveBeenCalledWith({ name: 'Mystic Realm' });
    });

    it('updates theme when select changes', () => {
      render(<GuidedFirstTimeExperience />);
      
      const themeSelect = screen.getByLabelText(/theme/i);
      fireEvent.change(themeSelect, { target: { value: 'fantasy' } });
      
      expect(mockUpdateData).toHaveBeenCalledWith({ theme: 'fantasy' });
    });

    it('shows all theme options', () => {
      render(<GuidedFirstTimeExperience />);
      
      const themeSelect = screen.getByLabelText(/theme/i);
      expect(themeSelect).toHaveTextContent('Fantasy');
      expect(themeSelect).toHaveTextContent('Sci-Fi');
      expect(themeSelect).toHaveTextContent('Modern');
      expect(themeSelect).toHaveTextContent('Historical');
      expect(themeSelect).toHaveTextContent('Horror');
      expect(themeSelect).toHaveTextContent('Mystery');
      expect(themeSelect).toHaveTextContent('Western');
      expect(themeSelect).toHaveTextContent('Cyberpunk');
      expect(themeSelect).toHaveTextContent('Other');
    });

    it('displays validation errors when present', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 2,
        stepValidation: {
          valid: false,
          errors: ['World name is required', 'Theme is required'],
          touched: true,
        },
      });

      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByText('World name is required')).toBeInTheDocument();
      expect(screen.getByText('Theme is required')).toBeInTheDocument();
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

    it('shows "Try it now" button on final step', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByRole('button', { name: /try it now/i })).toBeInTheDocument();
    });

    it('calls handleComplete when "Try it now" is clicked', () => {
      render(<GuidedFirstTimeExperience />);
      
      fireEvent.click(screen.getByRole('button', { name: /try it now/i }));
      expect(mockHandleComplete).toHaveBeenCalled();
    });

    it('disables "Try it now" button when validation fails', () => {
      (useWizardState as jest.Mock).mockReturnValue({
        ...mockWizard,
        currentStep: 2,
        isLastStep: true,
        stepValidation: { valid: false, errors: ['Name required'], touched: true },
      });

      render(<GuidedFirstTimeExperience />);
      
      const button = screen.getByRole('button', { name: /try it now/i });
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
      
      expect(screen.getByText('Creating World...')).toBeInTheDocument();
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