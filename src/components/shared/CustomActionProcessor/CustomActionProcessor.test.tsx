import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomActionProcessor from './CustomActionProcessor';
import * as actionSkillMapper from '@/lib/utils/actionSkillMapper';
import * as requirementEvaluator from '@/lib/utils/requirementEvaluator';

// Mock the action skill mapper
jest.mock('@/lib/utils/actionSkillMapper');
const mockActionSkillMapper = actionSkillMapper as jest.Mocked<typeof actionSkillMapper>;

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

  it('displays skill check results when action contains skills', () => {
    mockActionSkillMapper.detectSkillActions.mockReturnValue([
      { skillId: 'intimidation', action: 'intimidate', defaultDifficulty: 3 }
    ]);
    
    mockActionSkillMapper.createSkillRequirement.mockReturnValue({
      type: 'skill',
      targetId: 'intimidation',
      operator: 'gte',
      value: 3
    });
    
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

    expect(screen.getByText(/intimidation/i)).toBeInTheDocument();
    expect(mockActionSkillMapper.detectSkillActions).toHaveBeenCalledWith('I intimidate the guard');
  });

  it('calls onActionSubmit with skill check results', () => {
    const mockOnActionSubmit = jest.fn();
    
    mockActionSkillMapper.detectSkillActions.mockReturnValue([
      { skillId: 'intimidation', action: 'intimidate', defaultDifficulty: 3 }
    ]);
    
    mockActionSkillMapper.createSkillRequirement.mockReturnValue({
      type: 'skill',
      targetId: 'intimidation',
      operator: 'gte',
      value: 3
    });
    
    mockRequirementEvaluator.evaluateRequirement.mockReturnValue({
      success: true,
      current: 4,
      required: 3
    });

    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={mockOnActionSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    fireEvent.change(input, { target: { value: 'I intimidate the guard' } });
    
    const submitButton = screen.getByRole('button', { name: /submit action/i });
    fireEvent.click(submitButton);

    expect(mockOnActionSubmit).toHaveBeenCalledWith({
      text: 'I intimidate the guard',
      skillChecks: [{
        skillId: 'intimidation',
        skillName: 'Intimidation',
        action: 'intimidate',
        success: true,
        current: 4,
        required: 3
      }]
    });
  });

  it('handles actions without skill requirements', () => {
    const mockOnActionSubmit = jest.fn();
    
    mockActionSkillMapper.detectSkillActions.mockReturnValue([]);

    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={mockOnActionSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    fireEvent.change(input, { target: { value: 'I walk to the door' } });
    
    const submitButton = screen.getByRole('button', { name: /submit action/i });
    fireEvent.click(submitButton);

    expect(mockOnActionSubmit).toHaveBeenCalledWith({
      text: 'I walk to the door',
      skillChecks: []
    });
  });
});