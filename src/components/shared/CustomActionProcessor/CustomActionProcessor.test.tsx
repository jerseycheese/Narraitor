import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomActionProcessor from './CustomActionProcessor';
import * as skillDetectionService from '@/lib/ai/skillDetectionService';
import * as requirementEvaluator from '@/lib/utils/requirementEvaluator';

// Mock the abstraction hooks using new mock utilities
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.stateful(),
    asyncState: mockHookPresets.asyncState.withExecution()
  });
});

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

  it('renders input and button elements correctly', async () => {
    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    const button = screen.getByRole('button', { name: /submit action/i });

    // Test actual behavior: component renders the required elements
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled(); // Should be disabled when empty
  });

  it('renders submit button correctly', async () => {
    const mockOnActionSubmit = jest.fn();

    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={mockOnActionSubmit}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit action/i });
    
    // Test actual behavior: button should be present and clickable without throwing
    expect(submitButton).toBeInTheDocument();
    expect(() => {
      fireEvent.click(submitButton);
    }).not.toThrow();
  });

  it('accepts character prop and renders without crashing', async () => {
    const mockOnActionSubmit = jest.fn();

    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={mockOnActionSubmit}
      />
    );

    // Test actual component behavior - should render without crashing
    expect(screen.getByPlaceholderText(/describe your action/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit action/i })).toBeInTheDocument();
  });

  it('handles user interaction without throwing errors', async () => {
    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    
    // Test actual behavior: component should handle input events without crashing
    expect(() => {
      fireEvent.change(input, { target: { value: 'I test action' } });
    }).not.toThrow();
    
    expect(input).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit action/i })).toBeInTheDocument();
  });

  it('renders correctly with action text', async () => {
    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    fireEvent.change(input, { target: { value: 'I test action' } });

    // Test actual behavior: component should render correctly
    expect(input).toHaveValue('I test action');
    expect(screen.getByRole('button', { name: /submit action/i })).toBeEnabled();
  });
});