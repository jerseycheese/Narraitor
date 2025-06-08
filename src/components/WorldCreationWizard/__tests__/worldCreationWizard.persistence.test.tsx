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

describe.skip('WorldCreationWizard Integration - Persistence', () => {
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

  test.skip('persists world to store on completion', async () => {
    const { worldStore } = await import('@/state/worldStore');
    
    render(<WorldCreationWizard />);

    // Step 0: Template Step - Select a template and proceed
    await waitFor(() => expect(screen.getByText('Choose Template')).toBeInTheDocument());
    
    // Find and click the template selection button
    const createOwnButton = screen.getByText('Create My Own World');
    fireEvent.click(createOwnButton);
    
    // Use shared navigation to proceed
    fireEvent.click(screen.getByText('Next'));

    // Step 1: Basic Info Step
    await waitFor(() => expect(screen.getByText('Basic Information')).toBeInTheDocument());
    
    const nameInput = screen.getByTestId('world-name-input');
    const descriptionTextarea = screen.getByTestId('world-description-textarea');
    const genreSelect = screen.getByTestId('world-genre-select');
    
    fireEvent.change(nameInput, { target: { value: 'Test World' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'A test world for testing' } });
    fireEvent.change(genreSelect, { target: { value: 'fantasy' } });
    
    // Click Next button from shared navigation
    fireEvent.click(screen.getByText('Next'));
    
    // Step 2: Description Step
    await waitFor(() => expect(screen.getByText('Describe Your World')).toBeInTheDocument());
    
    const fullDescriptionTextarea = screen.getByTestId('world-full-description');
    fireEvent.change(fullDescriptionTextarea, { 
      target: { value: 'A test world description that is long enough to meet the minimum character requirement for AI analysis and generation.' }
    });
    
    // Generate AI suggestions
    fireEvent.click(screen.getByTestId('generate-suggestions-button'));
    
    // Wait for AI processing to complete and move to next step
    await waitFor(() => expect(screen.getByText('Review Attributes')).toBeInTheDocument(), { timeout: 3000 });
    
    // Step 3: Attribute Review Step
    // Select some attributes
    const attributeCheckboxes = screen.getAllByText('Select');
    fireEvent.click(attributeCheckboxes[0]);
    fireEvent.click(screen.getByText('Next'));
    
    // Step 4: Skill Review Step
    await waitFor(() => expect(screen.getByText('Review Skills')).toBeInTheDocument());
    // Select some skills
    const skillCheckboxes = screen.getAllByText('Select');
    fireEvent.click(skillCheckboxes[0]);
    fireEvent.click(screen.getByText('Next'));
    
    // Step 5: Finalize Step
    await waitFor(() => expect(screen.getByText('Finalize World')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create World'));
    
    // Verify store was called
    expect((worldStore as unknown as { getState: () => { createWorld: jest.Mock } }).getState().createWorld).toHaveBeenCalled();
    
    // Verify navigation
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/worlds'));
  });

  test.skip('persists selections when navigating between steps', async () => {
    render(<WorldCreationWizard />);

    // Step 0: Template Step - Select a template and proceed
    await waitFor(() => expect(screen.getByText('Choose Template')).toBeInTheDocument());
    
    const createOwnButton = screen.getByText('Create My Own World');
    fireEvent.click(createOwnButton);
    
    // Use shared navigation to proceed
    fireEvent.click(screen.getByText('Next'));
    
    // Step 1: Enter basic info
    await waitFor(() => expect(screen.getByText('Basic Information')).toBeInTheDocument());
    
    const nameInput = screen.getByTestId('world-name-input');
    const descriptionTextarea = screen.getByTestId('world-description-textarea');
    const genreSelect = screen.getByTestId('world-genre-select');
    
    fireEvent.change(nameInput, { target: { value: 'Persistent World' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'A persistent world' } });
    fireEvent.change(genreSelect, { target: { value: 'fantasy' } });
    fireEvent.click(screen.getByText('Next'));

    // Step 2: Add description
    await waitFor(() => expect(screen.getByText('Describe Your World')).toBeInTheDocument());
    
    const fullDescriptionTextarea = screen.getByTestId('world-full-description');
    fireEvent.change(fullDescriptionTextarea, { 
      target: { value: 'A persistent world that maintains state between navigation steps. This is a test to ensure data persistence works correctly.' }
    });
    fireEvent.click(screen.getByText('Next'));

    // Step 3: Select attributes
    await waitFor(() => expect(screen.getByText('Review Attributes')).toBeInTheDocument());
    
    const attributeSelects = screen.getAllByText('Select');
    fireEvent.click(attributeSelects[0]);
    if (attributeSelects[1]) {
      fireEvent.click(attributeSelects[1]);
    }
    
    // Go back to Step 2
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => expect(screen.getByText('Describe Your World')).toBeInTheDocument());
    
    // Go back to Step 1
    fireEvent.click(screen.getByText('Back'));
    
    // Verify basic info persisted
    await waitFor(() => expect(screen.getByText('Basic Information')).toBeInTheDocument());
    expect(screen.getByTestId('world-name-input')).toHaveValue('Persistent World');
    expect(screen.getByTestId('world-description-textarea')).toHaveValue('A persistent world');
    expect(screen.getByTestId('world-genre-select')).toHaveValue('fantasy');
    
    // Go forward again
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Describe Your World')).toBeInTheDocument());
    expect(screen.getByTestId('world-full-description')).toHaveValue('A persistent world that maintains state between navigation steps. This is a test to ensure data persistence works correctly.');
    
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Review Attributes')).toBeInTheDocument());
    
    // Verify attribute selections persisted
    const selectedTexts = screen.getAllByText('Selected');
    expect(selectedTexts.length).toBeGreaterThanOrEqual(1);
  });
});
