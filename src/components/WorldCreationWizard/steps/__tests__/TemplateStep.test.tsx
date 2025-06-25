import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the hooks with simple implementations
jest.mock('@/hooks', () => ({
  useFormState: jest.fn(() => ({
    data: { currentMode: 'traditional' },
    updateData: jest.fn(),
    updateField: jest.fn(),
    setData: jest.fn(),
    reset: jest.fn(),
    errors: {},
    hasErrors: false,
    isDirty: false,
    setErrors: jest.fn(),
    clearErrors: jest.fn(),
    validate: jest.fn(() => []),
    isValid: jest.fn(() => true)
  })),
  useAsyncState: jest.fn(() => ({
    data: null,
    error: null,
    isLoading: false,
    execute: jest.fn(async (fn) => await fn()),
    reset: jest.fn(),
    clearError: jest.fn()
  })),
  useModal: jest.fn(() => ({
    isOpen: false,
    open: jest.fn(),
    close: jest.fn(),
    toggle: jest.fn(),
    modalProps: {
      isOpen: false,
      onClose: jest.fn()
    }
  })),
  useErrorState: jest.fn(() => ({
    error: null,
    setError: jest.fn(),
    clearError: jest.fn(),
    hasError: false
  }))
}));

// Mock the generateUniqueId function
jest.mock('../../../../lib/utils/generateId', () => ({
  generateUniqueId: jest.fn().mockImplementation((prefix) => {
    return `${prefix}-123`;
  }),
}));

// Mock the templateLoader
jest.mock('../../../../lib/templates/templateLoader', () => ({
  applyWorldTemplate: jest.fn(() => 'mocked-world-id'),
}));

// Mock TemplateSelector component
jest.mock('../../../world/TemplateSelector', () => {
  return function MockTemplateSelector() {
    return (
      <div data-testid="template-selector">
        <div data-testid="template-card-western">Western</div>
        <div data-testid="template-card-sitcom">Sitcom</div>
        <div data-testid="template-card-fantasy">Fantasy</div>
      </div>
    );
  };
});

// Import the component after mocks are set up
import TemplateStep from '../TemplateStep';

describe('TemplateStep', () => {
  const defaultProps = {
    selectedTemplateId: null,
    onUpdate: jest.fn(),
    errors: {},
    onComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the template step correctly', () => {
    render(<TemplateStep {...defaultProps} />);
    
    expect(screen.getByTestId('template-step')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Choose Template')).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
  });


  test('renders action buttons', () => {
    render(<TemplateStep {...defaultProps} />);
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create My Own World')).toBeInTheDocument();
  });

  test('handles button interactions without crashing', () => {
    render(<TemplateStep {...defaultProps} />);
    
    const createOwnButton = screen.getByTestId('create-own-button');
    const cancelButton = screen.getByText('Cancel');
    
    // Test that buttons can be clicked without throwing
    expect(() => {
      fireEvent.click(createOwnButton);
    }).not.toThrow();
    
    expect(() => {
      fireEvent.click(cancelButton);
    }).not.toThrow();
  });
});