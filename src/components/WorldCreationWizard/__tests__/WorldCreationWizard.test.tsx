import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldCreationWizard from '../WorldCreationWizard';
import { WIZARD_STEPS } from '../WizardState';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the world store
jest.mock('@/state/worldStore', () => {
  const createWorldMock = jest.fn().mockReturnValue('mock-world-id');
  
  // Create a mock store function that can be called with a selector
  const mockStore = jest.fn((selector) => {
    // When called with a selector, apply the selector to our mock state
    if (typeof selector === 'function') {
      return selector({
        worlds: {},
        createWorld: createWorldMock,
        error: null,
        loading: false,
        setCurrentWorld: jest.fn(),
        fetchWorlds: jest.fn().mockResolvedValue(undefined)
      });
    }
    // Otherwise return the mock store
    return mockStore;
  });
  
  // Add setState method to the store
  mockStore.setState = jest.fn();
  mockStore.getState = jest.fn(() => ({ 
    worlds: {},
    createWorld: createWorldMock,
    error: null,
    loading: false
  }));
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

describe('WorldCreationWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders all wizard steps', () => {
    render(<WorldCreationWizard />);
    
    // Check if all steps are rendered
    WIZARD_STEPS.forEach((step) => {
      expect(screen.getByTestId(`wizard-step-${step.id}`)).toBeInTheDocument();
    });
  });
  
  test('starts with template step', () => {
    render(<WorldCreationWizard />);
    
    // Check if the first step is the template step
    expect(screen.getByTestId('template-step')).toBeInTheDocument();
    expect(screen.getByTestId('template-selector')).toBeInTheDocument();
  });
  
  test('initializing with a specific step works', () => {
    // Render with initial step 1 (Basic Info)
    render(<WorldCreationWizard initialStep={1} />);
    
    // Check if the current step is not the template step
    expect(screen.queryByTestId('template-step')).not.toBeInTheDocument();
    
    // Check if we moved past the template step
    expect(screen.queryByTestId('template-step')).not.toBeInTheDocument();
  });
  
  test('navigating between steps works', async () => {
    render(<WorldCreationWizard />);
    
    // Check if we are on template step
    expect(screen.getByTestId('template-step')).toBeInTheDocument();
    
    // Create own world to skip template selection
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Check if we moved past the template step
    expect(screen.queryByTestId('template-step')).not.toBeInTheDocument();
  });
  
  test('shows correct step count', () => {
    render(<WorldCreationWizard />);
    
    // Check if the wizard progress shows the correct step count
    expect(screen.getByTestId('wizard-progress')).toHaveTextContent(`Step 1 of ${WIZARD_STEPS.length}`);
  });
});
