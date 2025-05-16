import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldCreationWizard from '../WorldCreationWizard';
import { applyWorldTemplate } from '@/lib/templates/templateLoader';

// Mock the generateUniqueId function
jest.mock('@/lib/utils/generateId', () => ({
  generateUniqueId: jest.fn().mockImplementation((prefix) => {
    return `${prefix}-123`;
  }),
}));

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Define a type for the mock store function
type MockStoreFunction = {
  (selector: unknown): unknown;
  setState: jest.Mock;
  getState: jest.Mock;
  subscribe: jest.Mock;
};

// Mock the world store
jest.mock('@/state/worldStore', () => {
  const createWorldMock = jest.fn().mockReturnValue('mock-world-id');
  
  // Create a simplified but typed mock store
  const initialState = {
    worlds: {},
    createWorld: createWorldMock,
    error: null,
    loading: false,
    setCurrentWorld: jest.fn(),
    fetchWorlds: jest.fn().mockResolvedValue(undefined)
  };
  
  // Create a basic mock function
  const selectorFn = jest.fn(function(selector: unknown): unknown {
    if (typeof selector === 'function') {
      return selector(initialState);
    }
    return initialState;
  });
  
  // Cast to the proper type with required methods
  const mockStore = selectorFn as unknown as MockStoreFunction;
  
  mockStore.setState = jest.fn();
  mockStore.getState = jest.fn(() => initialState);
  mockStore.subscribe = jest.fn(() => jest.fn());
  
  return {
    worldStore: mockStore
  };
});

// Mock the template loader
jest.mock('@/lib/templates/templateLoader', () => ({
  applyWorldTemplate: jest.fn((templateOrId) => {
    console.log('Mock applyWorldTemplate called with:', templateOrId);
    return 'mock-world-id';
  }),
}));

describe('WorldCreationWizard Template Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('template selection and application flow', () => {
    render(<WorldCreationWizard />);
    
    // Verify we start at template step
    expect(screen.getByTestId('template-step')).toBeInTheDocument();
    
    // Verify the Use Template button is initially disabled
    expect(screen.getByTestId('next-button')).toBeDisabled();
    
    // Select a template
    fireEvent.click(screen.getByTestId('template-card-fantasy'));
    
    // Verify the Use Template button is now enabled
    expect(screen.getByTestId('next-button')).not.toBeDisabled();
    
    // Click Use Template button to apply template and move to next step
    fireEvent.click(screen.getByTestId('next-button'));
    
    // Verify the template was applied
    expect(applyWorldTemplate).toHaveBeenCalledWith('fantasy');
    
    // Verify we moved to the next step (basic info)
    expect(screen.queryByTestId('template-step')).not.toBeInTheDocument();
  });
  
  test('creating a world without template', () => {
    // Render with initial template step
    render(<WorldCreationWizard initialStep={0} />);
    
    // Click Create My Own World button
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Verify the template was not applied
    expect(applyWorldTemplate).not.toHaveBeenCalled();
    
    // Verify we moved to the next step
    expect(screen.queryByTestId('template-step')).not.toBeInTheDocument();
  });
  
  test('initializing with a selected template', () => {
    // Render with initial template selected
    render(
      <WorldCreationWizard 
        initialStep={0} 
        initialData={{ selectedTemplateId: 'western' }} 
      />
    );
    
    // Verify the template is selected
    expect(screen.getByTestId('template-card-western').className).toContain('border-blue-500');
    
    // Verify the Use Template button is enabled
    expect(screen.getByTestId('next-button')).not.toBeDisabled();
  });
  
  test('canceling from template step works', () => {
    const onCancelMock = jest.fn();
    
    // Render with onCancel prop
    render(<WorldCreationWizard onCancel={onCancelMock} />);
    
    // Click the cancel button
    fireEvent.click(screen.getByTestId('cancel-button'));
    
    // Verify onCancel was called
    expect(onCancelMock).toHaveBeenCalled();
  });
  
  test('ensuring template ID is passed correctly to applyWorldTemplate', async () => {
    render(<WorldCreationWizard />);
    
    // Select a specific template
    fireEvent.click(screen.getByTestId('template-card-sitcom'));
    
    // Apply template
    fireEvent.click(screen.getByTestId('next-button'));
    
    // Verify applyWorldTemplate was called with the correct template ID
    expect(applyWorldTemplate).toHaveBeenCalledWith('sitcom');
  });
});
