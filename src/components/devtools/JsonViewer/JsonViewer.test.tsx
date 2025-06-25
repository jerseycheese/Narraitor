import React from 'react';
import { render, screen } from '@testing-library/react';
import { JsonViewer } from './JsonViewer';

// Mock the hooks with stable state for testing
jest.mock('@/hooks', () => {
  return {
    useFormState: jest.fn(() => ({
      data: { isMounted: true },
      updateField: jest.fn(),
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
    }))
  };
});

describe('JsonViewer', () => {
  const testData = {
    name: 'Test Object',
    number: 42,
    nested: {
      property: 'value',
      array: [1, 2, 3]
    }
  };
  
  it('displays JSON data with proper formatting', () => {
    render(<JsonViewer data={testData} />);
    
    const container = screen.getByTestId('json-viewer');
    expect(container).toBeInTheDocument();
    
    // Should display the actual JSON content, not loading state
    const content = container.textContent || '';
    expect(content).toContain('Test Object');
    expect(content).toContain('42');
    expect(content).toContain('property');
    expect(content).toContain('value');
  });
  
});
