import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldCreationWizard from '../../../WorldCreationWizard/WorldCreationWizard';
import { applyWorldTemplate } from '../../../../lib/templates/templateLoader';

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

// Define a type for the mock store function
type MockStoreFunction = {
  (selector: unknown): unknown;
  setState: jest.Mock;
  getState: jest.Mock;
  subscribe: jest.Mock;
};

// Mock the worldStore
jest.mock('../../../../state/worldStore', () => {
  const createWorldMock = jest.fn().mockReturnValue('mocked-world-id');
  
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

// Mock next/navigation for the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: jest.fn().mockReturnValue('/'),
}));

describe('TemplateSelector Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('integrates with WorldCreationWizard', () => {
    // Render WorldCreationWizard
    render(<WorldCreationWizard />);
    
    // Check if template selector is rendered in the first step
    expect(screen.getByTestId('template-step')).toBeInTheDocument();
    
    // Select Western template
    fireEvent.click(screen.getByTestId('template-card-western'));
    
    // Click Use Template button
    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);
    
    // Verify template was applied with string ID
    expect(applyWorldTemplate).toHaveBeenCalledWith('western');
  });

  test('validates template selection before proceeding', () => {
    // Render WorldCreationWizard with template step
    render(<WorldCreationWizard />);
    
    // Check if Use Template button is disabled when no template is selected
    expect(screen.getByTestId('next-button')).toBeDisabled();
    
    // Select a template
    fireEvent.click(screen.getByTestId('template-card-fantasy'));
    
    // Check if Use Template button is now enabled
    expect(screen.getByTestId('next-button')).not.toBeDisabled();
  });
  
  test('allows creating a world without selecting a template', () => {
    // Render WorldCreationWizard
    render(<WorldCreationWizard />);
    
    // Click Create My Own World button
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Check that we moved to the next step
    expect(screen.queryByTestId('template-step')).not.toBeInTheDocument();
  });
});

// Mock next/navigation for the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: jest.fn().mockReturnValue('/'),
}));

describe('TemplateSelector Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('integrates with WorldCreationWizard', () => {
    // Render WorldCreationWizard
    render(<WorldCreationWizard />);
    
    // Check if template selector is rendered in the first step
    expect(screen.getByTestId('template-step')).toBeInTheDocument();
    
    // Select Western template
    fireEvent.click(screen.getByTestId('template-card-western'));
    
    // Click Use Template button
    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);
    
    // Verify template was applied with string ID
    expect(applyWorldTemplate).toHaveBeenCalledWith('western');
  });

  test('validates template selection before proceeding', () => {
    // Render WorldCreationWizard with template step
    render(<WorldCreationWizard />);
    
    // Check if Use Template button is disabled when no template is selected
    expect(screen.getByTestId('next-button')).toBeDisabled();
    
    // Select a template
    fireEvent.click(screen.getByTestId('template-card-fantasy'));
    
    // Check if Use Template button is now enabled
    expect(screen.getByTestId('next-button')).not.toBeDisabled();
  });
  
  test('allows creating a world without selecting a template', () => {
    // Render WorldCreationWizard
    render(<WorldCreationWizard />);
    
    // Click Create My Own World button
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Check that we moved to the next step
    expect(screen.queryByTestId('template-step')).not.toBeInTheDocument();
  });
});