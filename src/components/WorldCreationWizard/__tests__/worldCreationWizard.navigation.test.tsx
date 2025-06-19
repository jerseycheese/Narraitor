// No import for resetWorldStore - completely removed reference to it
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import WorldCreationWizard from '../WorldCreationWizard';

// Mock the next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue('/worlds/create'),
}));

// Mock worldAnalyzer
jest.mock('@/lib/ai/worldAnalyzer', () => ({
  analyzeWorldDescription: jest.fn().mockResolvedValue({
    attributes: [
      { name: 'Strength', description: 'Physical power', minValue: 1, maxValue: 10, accepted: false }
    ],
    skills: [
      { name: 'Combat', description: 'Fighting ability', difficulty: 'medium', accepted: false }
    ]
  })
}));

// Mock the worldStore
jest.mock('../../../state/worldStore', () => ({
  worldStore: {
    getState: jest.fn(() => ({
      worlds: {},
      currentWorldId: null,
      error: null,
      loading: false,
      createWorld: jest.fn().mockReturnValue('mock-world-id'),
      updateWorld: jest.fn(),
      deleteWorld: jest.fn(),
      setCurrentWorld: jest.fn(),
      fetchWorlds: jest.fn(),
      addAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addSkill: jest.fn(),
      updateSkill: jest.fn(),
      removeSkill: jest.fn(),
      updateSettings: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    })),
    setState: jest.fn(),
    subscribe: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe.skip('WorldCreationWizard Integration - Navigation', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks and store before each test
    jest.clearAllMocks();
    // We don't need resetWorldStore since we're mocking directly
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it.skip('navigates to world detail page after creation when no onComplete provided', async () => {
    render(<WorldCreationWizard />);
    
    // Step 0: Template Step - Select "Create My Own World" (this advances automatically)
    await act(async () => {
      const createOwnButton = await screen.findByTestId('create-own-button');
      fireEvent.click(createOwnButton);
    });

    // Step 1: Basic Info
    await act(async () => {
      await waitFor(() => expect(screen.getByTestId('world-name-input')).toBeInTheDocument());
      
      fireEvent.change(screen.getByTestId('world-name-input'), {
        target: { value: 'Test World' },
      });
      fireEvent.change(screen.getByTestId('world-description-textarea'), {
        target: { value: 'Test description' },
      });
      fireEvent.change(screen.getByTestId('world-genre-select'), {
        target: { value: 'fantasy' },
      });
      
      // Use shared navigation Next button
      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);
    });

    // Step 2: World Description
    await act(async () => {
      await waitFor(() => expect(screen.getByTestId('world-full-description')).toBeInTheDocument());
      
      fireEvent.change(screen.getByTestId('world-full-description'), {
        target: { value: 'A detailed world narrative with extensive historical background, unique features, and distinctive characteristics. This world has a rich cultural tapestry and fascinating geography.' },
      });
      
      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);
    });

    // Step 3: Attributes Review
    await act(async () => {
      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);
    });

    // Step 4: Skills Review
    await act(async () => {
      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);
    });

    // Step 5: Finalize
    await act(async () => {
      const completeButton = screen.getByRole('button', { name: 'Create World' });
      fireEvent.click(completeButton);
    });

    // Verify navigation to the worlds list page
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/worlds');
    });
  });

  it.skip('calls onComplete callback when provided', async () => {
    const mockOnComplete = jest.fn();
    render(<WorldCreationWizard onComplete={mockOnComplete} />);
    
    // Step 0: Template Step - Select "Create My Own World" (this advances automatically)
    await act(async () => {
      const createOwnButton = await screen.findByTestId('create-own-button');
      fireEvent.click(createOwnButton);
    });

    // Step 1: Basic Info
    await act(async () => {
      await waitFor(() => expect(screen.getByTestId('world-name-input')).toBeInTheDocument());
      
      fireEvent.change(screen.getByTestId('world-name-input'), {
        target: { value: 'Test World' },
      });
      fireEvent.change(screen.getByTestId('world-description-textarea'), {
        target: { value: 'Test description' },
      });
      fireEvent.change(screen.getByTestId('world-genre-select'), {
        target: { value: 'fantasy' },
      });
      
      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);
    });

    // Step 2: World Description
    await act(async () => {
      await waitFor(() => expect(screen.getByTestId('world-full-description')).toBeInTheDocument());
      
      fireEvent.change(screen.getByTestId('world-full-description'), {
        target: { value: 'A detailed world narrative with extensive historical background, unique features, and distinctive characteristics. This world has a rich cultural tapestry and fascinating geography.' },
      });
      
      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);
    });

    // Step 3: Attributes Review
    await act(async () => {
      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);
    });

    // Step 4: Skills Review
    await act(async () => {
      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);
    });

    // Step 5: Finalize
    await act(async () => {
      const completeButton = screen.getByRole('button', { name: 'Create World' });
      fireEvent.click(completeButton);
    });

    // Verify callback was called and navigation did not occur
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(expect.any(String));
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  it('handles navigation interruption', async () => {
    render(<WorldCreationWizard />);
    
    // Cancel button is in the shared navigation component
    await act(async () => {
      const cancelButton = await screen.findByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
    });

    // Verify navigation to the worlds list
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/worlds');
    });
  });
});
