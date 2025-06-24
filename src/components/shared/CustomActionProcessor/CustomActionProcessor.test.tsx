import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomActionProcessor from './CustomActionProcessor';
import * as skillDetectionService from '@/lib/ai/skillDetectionService';
import * as requirementEvaluator from '@/lib/utils/requirementEvaluator';

// Mock the abstraction hooks
jest.mock('@/hooks', () => ({
  useFormState: jest.fn((options) => {
    const [data, setData] = React.useState(options?.initialData || {
      actionText: '',
      skillCheckResults: []
    });
    
    return {
      data,
      updateField: jest.fn((field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
      }),
      updateData: jest.fn(),
      setData: jest.fn(),
      reset: jest.fn(),
      errors: [],
      hasErrors: false,
      isDirty: false,
      setErrors: jest.fn(),
      clearErrors: jest.fn(),
      validate: jest.fn(() => []),
      isValid: jest.fn(() => true)
    };
  }),
  useAsyncState: jest.fn(() => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState(null);
    
    return {
      data,
      isLoading,
      error,
      status: isLoading ? 'loading' : 'idle',
      execute: jest.fn(async (fn) => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await fn();
          setData(result);
          return result;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(errorMessage);
          return null;
        } finally {
          setIsLoading(false);
        }
      }),
      reset: jest.fn(),
      setData: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn()
    };
  })
}));

// Mock the AI skill detection service
jest.mock('@/lib/ai/skillDetectionService');
const mockSkillDetectionService = skillDetectionService as jest.Mocked<typeof skillDetectionService>;

// Mock the requirement evaluator
jest.mock('@/lib/utils/requirementEvaluator');
const mockRequirementEvaluator = requirementEvaluator as jest.Mocked<typeof requirementEvaluator>;

const mockCharacter = {
  skills: [
    { id: '1', characterId: 'char1', name: 'Intimidation', level: 4, worldSkillId: 'intimidation' },
    { id: '2', characterId: 'char1', name: 'Stealth', level: 2, worldSkillId: 'stealth' }
  ]
};

describe('CustomActionProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the singleton instance
    mockSkillDetectionService.skillDetectionService = {
      detectSkills: jest.fn(),
      clearCache: jest.fn()
    } as jest.Mocked<typeof skillDetectionService.skillDetectionService>;
  });

  it('renders action input field', () => {
    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    expect(screen.getByPlaceholderText(/describe your action/i)).toBeInTheDocument();
  });

  it('displays AI-detected skill check results', async () => {
    // Mock AI service response
    (mockSkillDetectionService.skillDetectionService.detectSkills as jest.Mock).mockResolvedValue({
      detectedSkills: [{
        skillId: 'intimidation',
        skillName: 'Intimidation',
        confidence: 0.9,
        reasoning: 'The action involves threatening behavior',
        suggestedDifficulty: 3
      }],
      error: null
    });
    
    // Mock requirement evaluator
    mockRequirementEvaluator.evaluateRequirement.mockReturnValue({
      success: true,
      current: 4,
      required: 3
    });

    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    fireEvent.change(input, { target: { value: 'I intimidate the guard' } });

    // Wait for debounced AI call
    await waitFor(() => {
      expect(screen.getByText(/intimidation/i)).toBeInTheDocument();
    }, { timeout: 1000 });

    expect(mockSkillDetectionService.skillDetectionService.detectSkills).toHaveBeenCalledWith(
      'I intimidate the guard',
      expect.arrayContaining([
        expect.objectContaining({ name: 'Intimidation' })
      ])
    );
  });

  it('calls onActionSubmit with AI-enhanced skill check results', async () => {
    const mockOnActionSubmit = jest.fn();
    
    // Mock AI service response
    (mockSkillDetectionService.skillDetectionService.detectSkills as jest.Mock).mockResolvedValue({
      detectedSkills: [{
        skillId: 'intimidation',
        skillName: 'Intimidation',
        confidence: 0.85,
        reasoning: 'Threatening behavior detected',
        suggestedDifficulty: 4
      }],
      error: null
    });
    
    mockRequirementEvaluator.evaluateRequirement.mockReturnValue({
      success: true,
      current: 4,
      required: 4
    });

    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={mockOnActionSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    fireEvent.change(input, { target: { value: 'I intimidate the guard' } });
    
    // Wait for AI analysis
    await waitFor(() => {
      expect(screen.getByText(/intimidation/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /submit action/i });
    fireEvent.click(submitButton);

    expect(mockOnActionSubmit).toHaveBeenCalledWith({
      text: 'I intimidate the guard',
      skillChecks: [{
        skillId: 'intimidation',
        skillName: 'Intimidation',
        success: true,
        current: 4,
        required: 4,
        confidence: 0.85,
        reasoning: 'Threatening behavior detected'
      }]
    });
  });

  it('handles actions without AI-detected skills', async () => {
    const mockOnActionSubmit = jest.fn();
    
    // Mock AI service response with no skills
    (mockSkillDetectionService.skillDetectionService.detectSkills as jest.Mock).mockResolvedValue({
      detectedSkills: [],
      error: null
    });

    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={mockOnActionSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    fireEvent.change(input, { target: { value: 'I walk to the door' } });
    
    // Wait for AI analysis
    await waitFor(() => {
      expect(mockSkillDetectionService.skillDetectionService.detectSkills).toHaveBeenCalled();
    });

    const submitButton = screen.getByRole('button', { name: /submit action/i });
    fireEvent.click(submitButton);

    expect(mockOnActionSubmit).toHaveBeenCalledWith({
      text: 'I walk to the door',
      skillChecks: []
    });
  });

  it('displays loading state during AI analysis', async () => {
    // Mock slow AI response
    (mockSkillDetectionService.skillDetectionService.detectSkills as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ detectedSkills: [], error: null }), 100))
    );

    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    fireEvent.change(input, { target: { value: 'I test action' } });

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/analyzing skills/i)).toBeInTheDocument();
    });
  });

  it('displays error when AI service fails', async () => {
    // Mock AI service error
    (mockSkillDetectionService.skillDetectionService.detectSkills as jest.Mock).mockResolvedValue({
      detectedSkills: [],
      error: 'AI service unavailable'
    });

    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    fireEvent.change(input, { target: { value: 'I test action' } });

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/error.*ai service unavailable/i)).toBeInTheDocument();
    });
  });
});