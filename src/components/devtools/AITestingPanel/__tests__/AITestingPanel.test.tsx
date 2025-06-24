import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AITestingPanel } from '../AITestingPanel';

// Mock the context override utilities
jest.mock('../../../../lib/ai/contextOverride', () => ({
  createTestContext: jest.fn().mockImplementation((world, character, context, config) => ({
    world: { ...world, ...config.worldOverride },
    character: { ...character, ...config.characterOverride },
    narrativeContext: { ...context, ...config.narrativeContext }
  }))
}));

// Mock the hooks using simple mock abstraction
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.static(),
    asyncState: mockHookPresets.asyncState.static()
  });
});

describe('AITestingPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock setTimeout to make tests run faster
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders testing interface components', () => {
    render(<AITestingPanel />);
    
    // Verify core components are present
    expect(screen.getByText(/world override/i)).toBeInTheDocument();
    expect(screen.getByText(/character override/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate narrative/i })).toBeInTheDocument();
    
    // Verify input fields are present
    expect(screen.getByLabelText(/world name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/character name/i)).toBeInTheDocument();
  });
});
