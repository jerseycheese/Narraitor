import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldSkillsForm from '@/components/forms/WorldSkillsForm';
import { WorldSkill, WorldAttribute } from '@/types/world.types';

describe('WorldSkillsForm - MVP Level Tests', () => {
  const mockAttributes: WorldAttribute[] = [
    {
      id: 'attr-1',
      worldId: 'world-123',
      name: 'Strength',
      description: 'Physical power',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
    },
  ];

  const mockSkills: WorldSkill[] = [
    {
      id: 'skill-1',
      worldId: 'world-123',
      name: 'Athletics',
      description: 'Physical prowess',
      linkedAttributeId: 'attr-1',
      difficulty: 'medium',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
    },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test displaying existing skills
  test('displays all existing skills', () => {
    render(
      <WorldSkillsForm 
        skills={mockSkills}
        attributes={mockAttributes}
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    // Check if skills are displayed
    expect(screen.getByDisplayValue('Athletics')).toBeInTheDocument();
  });

  // Test adding a new skill
  test('allows adding a new skill', () => {
    render(
      <WorldSkillsForm 
        skills={mockSkills}
        attributes={mockAttributes}
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    const addButton = screen.getByText('Add Skill');
    fireEvent.click(addButton);

    // Should call onChange with new skill added
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...mockSkills,
        expect.objectContaining({
          name: 'New Skill',
          worldId: 'world-123',
        }),
      ])
    );
  });

  // Test removing a skill
  test('allows removing a skill', () => {
    render(
      <WorldSkillsForm 
        skills={mockSkills}
        attributes={mockAttributes}
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    // Should call onChange with skill removed
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  // Test linking skill to attribute
  test('allows linking skill to attribute', () => {
    render(
      <WorldSkillsForm 
        skills={mockSkills}
        attributes={mockAttributes}
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    // Find the select by the label
    const linkedAttributeLabel = screen.getByText('Linked Attribute');
    const linkedAttributeSelect = linkedAttributeLabel.parentElement?.querySelector('select');
    
    if (linkedAttributeSelect) {
      fireEvent.change(linkedAttributeSelect, { target: { value: '' } });
    }

    expect(mockOnChange).toHaveBeenCalledWith([
      { ...mockSkills[0], linkedAttributeId: undefined },
    ]);
  });

  // Test empty state
  test('displays empty state when no skills exist', () => {
    render(
      <WorldSkillsForm 
        skills={[]}
        attributes={mockAttributes}
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    expect(screen.getByText(/No skills defined yet/i)).toBeInTheDocument();
  });

  // Test section heading
  test('displays correct section heading', () => {
    render(
      <WorldSkillsForm 
        skills={mockSkills}
        attributes={mockAttributes}
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    expect(screen.getByText('Skills')).toBeInTheDocument();
  });
});
