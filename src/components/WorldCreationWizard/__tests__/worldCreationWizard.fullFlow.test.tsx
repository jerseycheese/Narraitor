// FILEPATH: /src/components/WorldCreationWizard/__tests__/worldCreationWizard.fullFlow.test.tsx
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

describe('WorldCreationWizard Integration - Full Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful AI analysis 
    (worldAnalyzerModule.analyzeWorldDescription as jest.Mock).mockResolvedValue({
      attributes: [
        { name: 'Strength', description: 'Physical power', minValue: 1, maxValue: 10, baseValue: 5, accepted: false },
      ],
      skills: [
        { name: 'Combat', description: 'Fighting ability', difficulty: 'medium', category: 'Combat', linkedAttributeName: 'Strength', baseValue: 5, minValue: 1, maxValue: 10, accepted: false },
      ],
    });
  });

  test('completes full world creation flow', async () => {
    const { worldStore } = await import('@/state/worldStore');
    
    render(<WorldCreationWizard />);

    // Step 0: Template Step - click "Create My Own World" to continue
    expect(screen.getByTestId('template-step')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('create-own-button'));

    // Step 1: Basic Info
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'My Fantasy World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A fantastical world of magic and adventure' } });
    fireEvent.change(screen.getByTestId('world-genre-select'), { target: { value: 'fantasy' } });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Step 2: Description
    await waitFor(() => expect(screen.getByTestId('description-step')).toBeInTheDocument());
    const descriptionTextarea = screen.getByTestId('world-full-description');
    fireEvent.change(descriptionTextarea, { 
      target: { value: 'A magical realm filled with wizards, warriors, and mythical creatures. The land is divided into five kingdoms, each with unique cultures.' }
    });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Wait for AI processing
    await waitFor(() => expect(screen.getByText('Review Attributes')).toBeInTheDocument());

    // Step 3: Attributes - double click to ensure it's selected
    const attributeToggle = screen.getByTestId('attribute-toggle-0');
    fireEvent.click(attributeToggle); // First click may unselect if already selected
    fireEvent.click(attributeToggle); // Second click to ensure it's selected
    expect(attributeToggle).toHaveTextContent('Selected');
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Step 4: Skills
    await waitFor(() => expect(screen.getByTestId('skill-review-step')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('skill-toggle-0'));
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Step 5: Finalize
    await waitFor(() => expect(screen.getByTestId('finalize-step')).toBeInTheDocument());
    
    // Click complete and verify the mock was called
    fireEvent.click(screen.getByTestId('step-complete-button'));
    
    // Verify createWorld was called
    expect((worldStore as unknown as { getState: () => { createWorld: jest.Mock } }).getState().createWorld).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Fantasy World',
        theme: 'fantasy',
        skills: expect.arrayContaining([expect.objectContaining({ name: 'Combat' })]),
      })
    );
    
    // Verify navigation to world list
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/worlds'));
  });
});
