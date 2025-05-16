import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TemplateStep from '../TemplateStep';
import { templates } from '../../../../lib/templates/worldTemplates';
import { applyWorldTemplate } from '../../../../lib/templates/templateLoader';
import { createMockWorldStore } from '../../../../lib/test-utils/mockStore';

// Mock the generateUniqueId function
jest.mock('../../../../lib/utils/generateId', () => ({
  generateUniqueId: jest.fn().mockImplementation((prefix) => {
    return `${prefix}-123`;
  }),
}));

// Mock the templateLoader
jest.mock('../../../../lib/templates/templateLoader', () => ({
  applyWorldTemplate: jest.fn((templateOrId) => {
    console.log('Mock applyWorldTemplate called with:', templateOrId);
    return 'mocked-world-id';
  }),
}));

// Mock TemplateSelector component
jest.mock('../../../world/TemplateSelector', () => {
  return function MockTemplateSelector({ 
    onSelect, 
    selectedTemplateId 
  }: { 
    onSelect: (templateId: string) => void, 
    selectedTemplateId: string | null | undefined 
  }) {
    return (
      <div data-testid="template-selector">
        {templates.map((template) => (
          <div 
            key={template.id} 
            data-testid={`template-card-${template.id}`}
            onClick={() => onSelect(template.id)}
            className={selectedTemplateId === template.id ? 'border-blue-500 bg-blue-50' : ''}
          >
            {template.name}
          </div>
        ))}
      </div>
    );
  };
});

// Mock the worldStore
jest.mock('../../../../state/worldStore', () => {
  return {
    worldStore: createMockWorldStore()
  };
});

describe('TemplateStep', () => {
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnUpdate = jest.fn();

  const defaultProps = {
    selectedTemplateId: null,
    onUpdate: mockOnUpdate,
    onNext: mockOnNext,
    onBack: mockOnBack,
    onCancel: mockOnCancel,
    errors: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders the template step correctly', () => {
    render(<TemplateStep {...defaultProps} />);
    
    expect(screen.getByTestId('template-step')).toBeInTheDocument();
    expect(screen.getByTestId('template-selector')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByTestId('create-own-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeDisabled();
  });

  test('allows selecting a template', () => {
    render(<TemplateStep {...defaultProps} />);
    
    // Find the first template card and click it
    act(() => {
      fireEvent.click(screen.getByTestId(`template-card-${templates[0].id}`));
    });
    
    // State should be updated with the selected template
    expect(mockOnUpdate).toHaveBeenCalledWith({
      selectedTemplateId: templates[0].id
    });
  });

  test('enables Create My Own World button and calls onNext when clicked', () => {
    render(<TemplateStep {...defaultProps} />);
    
    const createOwnButton = screen.getByTestId('create-own-button');
    expect(createOwnButton).toBeInTheDocument();
    
    act(() => {
      fireEvent.click(createOwnButton);
    });
    
    expect(mockOnUpdate).toHaveBeenCalledWith({ selectedTemplateId: null });
    expect(mockOnNext).toHaveBeenCalled();
  });

  test('calls onNext with the selected template when next button is clicked', async () => {
    render(<TemplateStep {...defaultProps} selectedTemplateId={templates[0].id} />);
    
    // With template selected, next button should be enabled
    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).not.toBeDisabled();
    
    // Click the next button
    act(() => {
      fireEvent.click(nextButton);
    });
    
    // Check that applyWorldTemplate was called
    expect(applyWorldTemplate).toHaveBeenCalledWith(templates[0].id);
    
    // Fast-forward timers to execute the setTimeout
    act(() => {
      jest.runAllTimers();
    });
    
    // Now check that onNext was called after the timeout
    expect(mockOnNext).toHaveBeenCalled();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<TemplateStep {...defaultProps} />);
    
    const cancelButton = screen.getByTestId('cancel-button');
    
    act(() => {
      fireEvent.click(cancelButton);
    });
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('persists selected template in wizard state', () => {
    // Render with a preselected template
    render(<TemplateStep {...defaultProps} selectedTemplateId={templates[1].id} />);
    
    // The next button should be enabled because a template is already selected
    expect(screen.getByTestId('next-button')).not.toBeDisabled();
  });
});