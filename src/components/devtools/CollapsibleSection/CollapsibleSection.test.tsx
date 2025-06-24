import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection } from './CollapsibleSection';

// Mock the hooks with functional state for testing toggle behavior
jest.mock('@/hooks', () => {
  return {
    useFormState: jest.fn((options) => {
      const [data, setData] = React.useState(options?.initialData || { isExpanded: true });
      
      const updateField = jest.fn((field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
      });
      
      return {
        data,
        updateField,
        updateData: jest.fn((updates) => setData(prev => ({ ...prev, ...updates }))),
        setData: jest.fn(setData),
        reset: jest.fn(() => setData(options?.initialData || { isExpanded: true })),
        errors: [],
        hasErrors: false,
        isDirty: false,
        setErrors: jest.fn(),
        clearErrors: jest.fn(),
        validate: jest.fn(() => []),
        isValid: jest.fn(() => true)
      };
    })
  };
});

describe('CollapsibleSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders title and content, toggles expanded state on click', () => {
    render(
      <CollapsibleSection title="Test Section">
        <div data-testid="section-content">Content</div>
      </CollapsibleSection>
    );
    
    // Should render basic structure
    expect(screen.getByTestId('collapsible-section-title')).toHaveTextContent('Test Section');
    expect(screen.getByTestId('section-content')).toBeInTheDocument();
    
    // Should be expanded by default
    const toggle = screen.getByTestId('collapsible-section-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('collapsible-section-content')).toHaveClass('block');
    
    // Should collapse when clicked
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('collapsible-section-content')).toHaveClass('hidden');
  });
  
  it('can be initialized as collapsed', () => {
    render(
      <CollapsibleSection title="Test Section" initiallyExpanded={false}>
        <div data-testid="section-content">Content</div>
      </CollapsibleSection>
    );
    
    const toggle = screen.getByTestId('collapsible-section-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('collapsible-section-content')).toHaveClass('hidden');
  });
});
