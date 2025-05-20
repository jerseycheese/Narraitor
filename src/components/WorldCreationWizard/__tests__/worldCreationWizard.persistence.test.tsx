// FILEPATH: /src/components/WorldCreationWizard/__tests__/worldCreationWizard.persistence.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorldCreationWizard from '../WorldCreationWizard';
import * as worldAnalyzerModule from '@/lib/ai/worldAnalyzer';

// Mock next/navigation
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn(),
  forward: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}));

// Mock worldStore
jest.mock('@/state/worldStore');

// Mock worldAnalyzer
jest.mock('@/lib/ai/worldAnalyzer');

describe('WorldCreationWizard Integration - Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful AI analysis 
    (worldAnalyzerModule.analyzeWorldDescription as jest.Mock).mockResolvedValue({
      attributes: [
        { name: 'Strength', description: 'Physical power', minValue: 1, maxValue: 10, accepted: false },
        { name: 'Intelligence', description: 'Mental capacity', minValue: 1, maxValue: 10, accepted: false },
      ],
      skills: [
        { name: 'Combat', description: 'Fighting ability', difficulty: 'medium', accepted: false },
        { name: 'Stealth', description: 'Sneaking ability', difficulty: 'hard', accepted: false },
      ],
    });
  });

  test('persists world to store on completion', async () => {
    const { worldStore } = await import('@/state/worldStore');
    
    render(<WorldCreationWizard />);

    // First, navigate past the template step by clicking 'Create My Own World'
    fireEvent.click(screen.getByTestId('create-own-button'));

    // Now continue with the basic info step
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'This is a test description that meets the minimum requirement.' } });
    fireEvent.click(screen.getByTestId('step-next-button'));
    
    await waitFor(() => expect(screen.getByTestId('description-step')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('world-full-description'), { 
      target: { value: 'A test world description that is long enough to meet the minimum character requirement.' }
    });
    fireEvent.click(screen.getByTestId('step-next-button'));
    
    await waitFor(() => expect(screen.getByTestId('attribute-review-step')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('attribute-toggle-0'));
    fireEvent.click(screen.getByTestId('step-next-button'));
    
    await waitFor(() => expect(screen.getByTestId('skill-review-step')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('skill-toggle-0'));
    fireEvent.click(screen.getByTestId('step-next-button'));
    
    await waitFor(() => expect(screen.getByTestId('finalize-step')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('step-complete-button'));
    
    // Verify store was called
    expect((worldStore as unknown as { getState: () => { createWorld: jest.Mock } }).getState().createWorld).toHaveBeenCalled();
    
    // Verify navigation
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/worlds'));
  });

  test('persists selections when navigating between steps', async () => {
    render(<WorldCreationWizard />);

    // Step 1: Navigate past the template step by clicking 'Create My Own World'
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Step 2: Enter basic info
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'Persistent World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'This is a test description that meets the minimum requirement.' } });
    fireEvent.change(screen.getByTestId('world-genre-select'), { target: { value: 'fantasy' } });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Step 2: Add description
    await waitFor(() => expect(screen.getByText('Describe Your World')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('world-full-description'), { 
      target: { value: 'A persistent world that maintains state between navigation steps. This is a test to ensure data persistence.' }
    });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Step 3: Select attributes
    await waitFor(() => expect(screen.getByTestId('attribute-review-step')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('attribute-toggle-0'));
    fireEvent.click(screen.getByTestId('attribute-toggle-1'));
    
    // Go back to Step 1
    fireEvent.click(screen.getByTestId('step-back-button'));
    await waitFor(() => expect(screen.getByText('Describe Your World')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('step-back-button'));
    
    // Verify basic info persisted
    await waitFor(() => expect(screen.getByTestId('basic-info-step')).toBeInTheDocument());
    expect(screen.getByTestId('world-name-input')).toHaveValue('Persistent World');
    expect(screen.getByTestId('world-genre-select')).toHaveValue('fantasy');
    
    // Go forward again
    fireEvent.click(screen.getByTestId('step-next-button'));
    await waitFor(() => expect(screen.getByText('Describe Your World')).toBeInTheDocument());
    expect(screen.getByTestId('world-full-description')).toHaveValue('A persistent world that maintains state between navigation steps. This is a test to ensure data persistence.');
    
    fireEvent.click(screen.getByTestId('step-next-button'));
    await waitFor(() => expect(screen.getByTestId('attribute-review-step')).toBeInTheDocument());
    
    // Verify attribute selections persisted
    expect(screen.getByTestId('attribute-toggle-0')).toHaveTextContent('Selected');
    expect(screen.getByTestId('attribute-toggle-1')).toHaveTextContent('Selected');
  });
});
