import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
      baseValue: 5,
      category: 'Physical',
      accepted: false
    },
    {
      name: 'Intelligence',
      description: 'Mental acuity',
      minValue: 1,
      maxValue: 10,
      baseValue: 5,
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
      linkedAttributeNames: ['Strength'],
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
      accepted: false
    },
    {
      name: 'Research',
      description: 'Information gathering',
      difficulty: 'easy',
      category: 'Mental',
      linkedAttributeNames: ['Intelligence'],
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
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

  it('should allow accepting and rejecting attributes through buttons', () => {
    const TestWrapper = () => {
      const [attributes, setAttributes] = React.useState(mockAttributes);
      
      const handleAccept = (attribute: AttributeSuggestion) => {
        setAttributes(prev => prev.map(attr => 
          attr.name === attribute.name ? { ...attr, accepted: true } : attr
        ));
      };
      
      const handleReject = (attribute: AttributeSuggestion) => {
        setAttributes(prev => prev.filter(attr => attr.name !== attribute.name));
      };
      
      return (
        <div>
          <AISuggestions
            loading={false}
            attributes={attributes}
            skills={mockSkills}
            onAcceptAttribute={handleAccept}
            onRejectAttribute={handleReject}
            onAcceptSkill={mockOnAcceptSkill}
            onRejectSkill={mockOnRejectSkill}
          />
          <div data-testid="attribute-count">Attributes: {attributes.length}</div>
        </div>
      );
    };

    render(<TestWrapper />);

    // Initially should show both attributes
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByTestId('attribute-count')).toHaveTextContent('Attributes: 2');

    // Accept the first attribute
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    fireEvent.click(acceptButtons[0]);

    // Should still show both attributes (accepted ones stay visible)
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();

    // Reject the second attribute
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
    fireEvent.click(rejectButtons[1]);

    // Should only show first attribute now
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.queryByText('Intelligence')).not.toBeInTheDocument();
    expect(screen.getByTestId('attribute-count')).toHaveTextContent('Attributes: 1');
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

    expect(screen.getByText(/No suggestions available/i)).toBeInTheDocument();
  });

  it('should display accepted attributes with visual indication', () => {
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

    // Accepted attributes should still be visible and interactive
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Physical power')).toBeInTheDocument();
    
    // Should have accept/reject buttons available for accepted items too
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
    expect(acceptButtons.length).toBeGreaterThan(0);
    expect(rejectButtons.length).toBeGreaterThan(0);
  });
});
