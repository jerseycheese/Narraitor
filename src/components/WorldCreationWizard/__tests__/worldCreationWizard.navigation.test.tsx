import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import WorldCreationWizard from '../WorldCreationWizard';
import { mockCreateWorld, setupMocks } from './worldCreationWizard.test-helpers';

describe('WorldCreationWizard Integration - Navigation', () => {
  let mockRouter: ReturnType<typeof useRouter>;
  let mockOnComplete: jest.Mock;
  
  beforeEach(() => {
    const setup = setupMocks();
    mockRouter = setup.mockRouter;
    mockOnComplete = jest.fn();
    
    // Configure mock behavior
    mockCreateWorld.mockImplementation(() => {
      const worldId = 'world-456';
      return worldId;
    });
  });

  test('navigates to world detail page after creation when no onComplete provided', async () => {
    await act(async () => {
      render(<WorldCreationWizard />);
    });

    // Navigate to final step quickly
    await act(async () => {
      // Basic Info
      await fireEvent.change(await screen.findByTestId('world-name-input'), {
        target: { value: 'Test World' },
      });
      await fireEvent.change(await screen.findByTestId('world-description-textarea'), {
        target: { value: 'Test description that is long enough' },
      });
      await fireEvent.click(await screen.findByTestId('step-next-button'));
    });

    // Description
    await screen.findByTestId('description-step');
    await act(async () => {
      await fireEvent.change(await screen.findByTestId('world-full-description'), {
        target: { value: 'This is a test description for the world that is long enough.' },
      });
      await fireEvent.click(await screen.findByTestId('step-next-button'));
    });
    
    // Wait for AI processing
    await waitFor(() => screen.getByTestId('attribute-review-step'), { timeout: 5000 });

    // Attribute Review - select none, just proceed
    await act(async () => {
      await fireEvent.click(await screen.findByTestId('step-next-button'));
    });

    // Skill Review
    await waitFor(() => {
      const stepIndicator = screen.getByTestId('wizard-progress');
      return stepIndicator.textContent?.includes('Step 4 of 5');
    }, { timeout: 5000 });

    await act(async () => {
      await fireEvent.click(await screen.findByTestId('step-next-button'));
    });

    // Finalize
    await screen.findByTestId('finalize-step');
    await act(async () => {
      const completeButton = await screen.findByTestId('step-complete-button');
      fireEvent.click(completeButton);
    });
    
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/worlds'));
  });

  test('calls onComplete callback when provided', async () => {
    await act(async () => {
      render(<WorldCreationWizard onComplete={mockOnComplete} />);
    });

    // Navigate to final step quickly
    await act(async () => {
      // Basic Info
      await fireEvent.change(await screen.findByTestId('world-name-input'), {
        target: { value: 'Test World' },
      });
      await fireEvent.change(await screen.findByTestId('world-description-textarea'), {
        target: { value: 'Test description that is long enough' },
      });
      await fireEvent.click(await screen.findByTestId('step-next-button'));
    });

    // Description
    await screen.findByTestId('description-step');
    await act(async () => {
      await fireEvent.change(await screen.findByTestId('world-full-description'), {
        target: { value: 'This is a test description for the world that is long enough.' },
      });
      await fireEvent.click(await screen.findByTestId('step-next-button'));
    });
    
    // Wait for AI processing
    await waitFor(() => screen.getByTestId('attribute-review-step'), { timeout: 5000 });

    // Attribute Review - select none, just proceed
    await act(async () => {
      await fireEvent.click(await screen.findByTestId('step-next-button'));
    });

    // Skill Review
    await waitFor(() => {
      const stepIndicator = screen.getByTestId('wizard-progress');
      return stepIndicator.textContent?.includes('Step 4 of 5');
    }, { timeout: 5000 });

    await act(async () => {
      await fireEvent.click(await screen.findByTestId('step-next-button'));
    });

    // Finalize
    await screen.findByTestId('finalize-step');
    await act(async () => {
      const completeButton = await screen.findByTestId('step-complete-button');
      fireEvent.click(completeButton);
    });
    
    await waitFor(() => expect(mockOnComplete).toHaveBeenCalledWith('world-456'), { timeout: 5000 });
    // Should not navigate when onComplete is provided
    expect(mockRouter.push).not.toHaveBeenCalledWith('/worlds');
  });

  test('handles navigation interruption', async () => {
    await act(async () => {
      render(<WorldCreationWizard />);
    });

    // Navigate away during the wizard
    act(() => {
      mockRouter.push('/some-other-page');
    });

    // Attempt to interact with the wizard (should not throw errors)
    await act(async () => {
      const cancelButton = await screen.findByTestId('step-cancel-button');
      fireEvent.click(cancelButton);
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/worlds');
  });
});