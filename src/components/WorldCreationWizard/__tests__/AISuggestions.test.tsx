import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AISuggestions } from '../AISuggestions';
import { AttributeSuggestion, SkillSuggestion } from '../WorldCreationWizard';

describe('AISuggestions', () => {
  const mockOnAcceptAttribute = jest.fn();
  const mockOnRejectAttribute = jest.fn();
  const mockOnAcceptSkill = jest.fn();
  const mockOnRejectSkill = jest.fn();

  const mockAttributes: AttributeSuggestion[] = [
    {
      name: 'Strength',
      description: 'Physical power',
      minValue: 1,
      maxValue: 10,
      category: 'Physical',
      accepted: false
    },
    {
      name: 'Intelligence',
      description: 'Mental acuity',
      minValue: 1,
      maxValue: 10,
      category: 'Mental',
      accepted: false
    }
  ];

  const mockSkills: SkillSuggestion[] = [
    {
      name: 'Combat',
      description: 'Fighting ability',
      difficulty: 'medium',
      category: 'Physical',
      linkedAttributeName: 'Strength',
      accepted: false
    },
    {
      name: 'Research',
      description: 'Information gathering',
      difficulty: 'easy',
      category: 'Mental',
      linkedAttributeName: 'Intelligence',
      accepted: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state while suggestions are being generated', () => {
    render(
      <AISuggestions
        loading={true}
        attributes={[]}
        skills={[]}
        onAcceptAttribute={mockOnAcceptAttribute}
        onRejectAttribute={mockOnRejectAttribute}
        onAcceptSkill={mockOnAcceptSkill}
        onRejectSkill={mockOnRejectSkill}
      />
    );

    expect(screen.getByText(/Analyzing world description/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display attribute suggestions when loaded', () => {
    render(
      <AISuggestions
        loading={false}
        attributes={mockAttributes}
        skills={mockSkills}
        onAcceptAttribute={mockOnAcceptAttribute}
        onRejectAttribute={mockOnRejectAttribute}
        onAcceptSkill={mockOnAcceptSkill}
        onRejectSkill={mockOnRejectSkill}
      />
    );

    // Check that all attributes are displayed
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Physical power')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Mental acuity')).toBeInTheDocument();
  });

  it('should display skill suggestions when loaded', () => {
    render(
      <AISuggestions
        loading={false}
        attributes={mockAttributes}
        skills={mockSkills}
        onAcceptAttribute={mockOnAcceptAttribute}
        onRejectAttribute={mockOnRejectAttribute}
        onAcceptSkill={mockOnAcceptSkill}
        onRejectSkill={mockOnRejectSkill}
      />
    );

    // Check that all skills are displayed
    expect(screen.getByText('Combat')).toBeInTheDocument();
    expect(screen.getByText('Fighting ability')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('Information gathering')).toBeInTheDocument();
  });

  it('should call onAcceptAttribute when accept button is clicked', () => {
    render(
      <AISuggestions
        loading={false}
        attributes={mockAttributes}
        skills={mockSkills}
        onAcceptAttribute={mockOnAcceptAttribute}
        onRejectAttribute={mockOnRejectAttribute}
        onAcceptSkill={mockOnAcceptSkill}
        onRejectSkill={mockOnRejectSkill}
      />
    );

    // Find and click the accept button for the first attribute
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    fireEvent.click(acceptButtons[0]);

    expect(mockOnAcceptAttribute).toHaveBeenCalledWith(mockAttributes[0]);
  });

  it('should call onRejectAttribute when reject button is clicked', () => {
    render(
      <AISuggestions
        loading={false}
        attributes={mockAttributes}
        skills={mockSkills}
        onAcceptAttribute={mockOnAcceptAttribute}
        onRejectAttribute={mockOnRejectAttribute}
        onAcceptSkill={mockOnAcceptSkill}
        onRejectSkill={mockOnRejectSkill}
      />
    );

    // Find and click the reject button for the first attribute
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
    fireEvent.click(rejectButtons[0]);

    expect(mockOnRejectAttribute).toHaveBeenCalledWith(mockAttributes[0]);
  });

  it('should display error state when suggestions fail to load', () => {
    render(
      <AISuggestions
        loading={false}
        error="Failed to generate suggestions"
        attributes={[]}
        skills={[]}
        onAcceptAttribute={mockOnAcceptAttribute}
        onRejectAttribute={mockOnRejectAttribute}
        onAcceptSkill={mockOnAcceptSkill}
        onRejectSkill={mockOnRejectSkill}
      />
    );

    expect(screen.getByText(/Failed to generate suggestions/i)).toBeInTheDocument();
  });

  it('should display empty state when no suggestions are available', () => {
    render(
      <AISuggestions
        loading={false}
        attributes={[]}
        skills={[]}
        onAcceptAttribute={mockOnAcceptAttribute}
        onRejectAttribute={mockOnRejectAttribute}
        onAcceptSkill={mockOnAcceptSkill}
        onRejectSkill={mockOnRejectSkill}
      />
    );

    expect(screen.getByText(/No AI suggestions available/i)).toBeInTheDocument();
  });

  it('should display attributes with accepted status', () => {
    const acceptedAttributes = [...mockAttributes];
    acceptedAttributes[0].accepted = true;

    render(
      <AISuggestions
        loading={false}
        attributes={acceptedAttributes}
        skills={mockSkills}
        onAcceptAttribute={mockOnAcceptAttribute}
        onRejectAttribute={mockOnRejectAttribute}
        onAcceptSkill={mockOnAcceptSkill}
        onRejectSkill={mockOnRejectSkill}
      />
    );

    // The accepted attribute should have visual indication
    const strengthCard = screen.getByText('Strength').closest('[role="article"]');
    expect(strengthCard).toHaveClass('accepted');
  });
});