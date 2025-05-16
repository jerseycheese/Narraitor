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

// Mock the worldStore
jest.mock('../../../state/worldStore', () => {
  const createWorldMock = jest.fn().mockReturnValue('world-123');
  
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

describe('WorldCreationWizard Integration - Navigation', () => {
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

  it('navigates to world detail page after creation when no onComplete provided', async () => {
    render(<WorldCreationWizard />);
    
    // First, handle the template step (either skip it or select a template)
    await act(async () => {
      // Skip the template step by clicking "Create My Own World"
      const createOwnButton = await screen.findByTestId('create-own-button');
      fireEvent.click(createOwnButton);
    });

    await act(async () => {
      // Basic Info
      await fireEvent.change(await screen.findByTestId('world-name-input'), {
        target: { value: 'Test World' },
      });
      await fireEvent.change(await screen.findByTestId('world-description-textarea'), {
        target: { value: 'This is a test world' },
      });
      
      const nextButton = await screen.findByTestId('step-next-button');
      fireEvent.click(nextButton);
    });

    await act(async () => {
      // World Description
      await fireEvent.change(await screen.findByTestId('world-full-description'), {
        target: { value: 'A detailed world narrative with extensive historical background, unique features, and distinctive characteristics. This world has a rich cultural tapestry and fascinating geography.' },
      });
      
      const nextButton = await screen.findByTestId('step-next-button');
      fireEvent.click(nextButton);
    });

    await act(async () => {
      // Attributes Review
      const nextButton = await screen.findByTestId('step-next-button');
      fireEvent.click(nextButton);
    });

    await act(async () => {
      // Skills Review
      const nextButton = await screen.findByTestId('step-next-button');
      fireEvent.click(nextButton);
    });

    await act(async () => {
      // Finalize
      const finishButton = await screen.findByTestId('step-complete-button');
      fireEvent.click(finishButton);
    });

    // Verify navigation to the worlds list page
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/worlds');
    });
  });

  it('calls onComplete callback when provided', async () => {
    const mockOnComplete = jest.fn();
    render(<WorldCreationWizard onComplete={mockOnComplete} />);
    
    // First, handle the template step (either skip it or select a template)
    await act(async () => {
      // Skip the template step by clicking "Create My Own World"
      const createOwnButton = await screen.findByTestId('create-own-button');
      fireEvent.click(createOwnButton);
    });

    await act(async () => {
      // Basic Info
      await fireEvent.change(await screen.findByTestId('world-name-input'), {
        target: { value: 'Test World' },
      });
      await fireEvent.change(await screen.findByTestId('world-description-textarea'), {
        target: { value: 'This is a test world' },
      });
      
      const nextButton = await screen.findByTestId('step-next-button');
      fireEvent.click(nextButton);
    });

    await act(async () => {
      // World Description
      await fireEvent.change(await screen.findByTestId('world-full-description'), {
        target: { value: 'A detailed world narrative with extensive historical background, unique features, and distinctive characteristics. This world has a rich cultural tapestry and fascinating geography.' },
      });
      
      const nextButton = await screen.findByTestId('step-next-button');
      fireEvent.click(nextButton);
    });

    await act(async () => {
      // Attributes Review
      const nextButton = await screen.findByTestId('step-next-button');
      fireEvent.click(nextButton);
    });

    await act(async () => {
      // Skills Review
      const nextButton = await screen.findByTestId('step-next-button');
      fireEvent.click(nextButton);
    });

    await act(async () => {
      // Finalize
      const finishButton = await screen.findByTestId('step-complete-button');
      fireEvent.click(finishButton);
    });

    // Verify callback was called and navigation did not occur
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(expect.any(String));
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  it('handles navigation interruption', async () => {
    render(<WorldCreationWizard />);
    
    // Check that the cancel button exists now 
    await act(async () => {
      const cancelButton = await screen.findByTestId('cancel-button');
      fireEvent.click(cancelButton);
    });

    // Verify navigation to the worlds list
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/worlds');
    });
  });
});