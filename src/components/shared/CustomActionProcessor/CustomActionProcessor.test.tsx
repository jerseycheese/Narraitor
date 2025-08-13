import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomActionProcessor from './CustomActionProcessor';

const mockCharacter = {
  skills: [
    { id: '1', characterId: 'char1', name: 'Intimidation', level: 4, worldSkillId: 'intimidation' },
    { id: '2', characterId: 'char1', name: 'Stealth', level: 2, worldSkillId: 'stealth' }
  ]
};

describe('CustomActionProcessor', () => {
  test('renders action input field and submit button', () => {
    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    expect(screen.getByPlaceholderText(/describe your action/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit action/i })).toBeInTheDocument();
  });

  test('allows user to type custom actions', () => {
    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    fireEvent.change(input, { target: { value: 'I search for clues' } });

    expect(input).toHaveValue('I search for clues');
  });

  test('submits action when button is clicked', () => {
    const mockOnActionSubmit = jest.fn();
    
    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={mockOnActionSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    const submitButton = screen.getByRole('button', { name: /submit action/i });
    
    fireEvent.change(input, { target: { value: 'I search for clues' } });
    fireEvent.click(submitButton);

    expect(mockOnActionSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnActionSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'I search for clues'
      })
    );
  });

  test('clears input after successful submission', () => {
    const mockOnActionSubmit = jest.fn();
    
    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={mockOnActionSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    const submitButton = screen.getByRole('button', { name: /submit action/i });
    
    fireEvent.change(input, { target: { value: 'I search for clues' } });
    fireEvent.click(submitButton);

    expect(input).toHaveValue('');
  });

  test('disables submit when input is empty', () => {
    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit action/i });
    expect(submitButton).toBeDisabled();
  });

  test('enables submit when input has text', () => {
    render(
      <CustomActionProcessor 
        character={mockCharacter}
        onActionSubmit={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/describe your action/i);
    const submitButton = screen.getByRole('button', { name: /submit action/i });
    
    fireEvent.change(input, { target: { value: 'I look around' } });
    
    expect(submitButton).not.toBeDisabled();
  });
});