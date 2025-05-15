import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import WorldCreationWizard from '../WorldCreationWizard';
import { mockCreateWorld, setupMocks } from './worldCreationWizard.test-helpers';

describe('WorldCreationWizard', () => {
  let mockRouter: ReturnType<typeof useRouter>;
  
  beforeEach(() => {
    const setup = setupMocks();
    mockRouter = setup.mockRouter;
    mockCreateWorld.mockReturnValue('world-123');
  });

  test('renders wizard container', () => {
    render(<WorldCreationWizard />);
    expect(screen.getByTestId('wizard-container')).toBeInTheDocument();
  });

  test('displays correct initial step', () => {
    render(<WorldCreationWizard />);
    expect(screen.getByTestId('wizard-progress')).toHaveTextContent('Step 1 of 5');
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
  });

  test('maintains state between step transitions', async () => {
    render(<WorldCreationWizard />);
    
    // Fill in basic info
    await act(async () => {
      fireEvent.change(screen.getByTestId('world-name-input'), {
        target: { value: 'Test World' },
      });
    });
    
    // Try advancing without filling required fields
    await act(async () => {
      fireEvent.click(screen.getByTestId('step-next-button'));
    });
    
    // Should still be on step 1 due to validation
    expect(screen.getByTestId('wizard-progress')).toHaveTextContent('Step 1 of 5');
    
    // Fill in the required description
    await act(async () => {
      fireEvent.change(screen.getByTestId('world-description-textarea'), {
        target: { value: 'A test world description that is long enough' },
      });
    });
    
    // Now advance to next step
    await act(async () => {
      fireEvent.click(screen.getByTestId('step-next-button'));
    });
    
    // Wait for the description step to appear
    await waitFor(() => screen.getByTestId('description-step'));
    
    // Go back and verify data is maintained
    await act(async () => {
      fireEvent.click(screen.getByTestId('step-back-button'));
    });
    
    await waitFor(() => screen.getByTestId('basic-info-step'));
    
    // Verify the previously entered values are still there
    expect(screen.getByTestId('world-name-input')).toHaveValue('Test World');
    expect(screen.getByTestId('world-description-textarea')).toHaveValue('A test world description that is long enough');
  });

  test('handles cancel action', async () => {
    render(<WorldCreationWizard />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('step-cancel-button'));
    });
    
    expect(mockRouter.push).toHaveBeenCalledWith('/worlds');
  });

  test('calls onCancel when provided', async () => {
    const mockOnCancel = jest.fn();
    render(<WorldCreationWizard onCancel={mockOnCancel} />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('step-cancel-button'));
    });
    
    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('validates required fields', async () => {
    render(<WorldCreationWizard />);
    
    // Try to advance without filling required fields
    await act(async () => {
      fireEvent.click(screen.getByTestId('step-next-button'));
    });
    
    // Should show validation errors
    expect(screen.getByTestId('description-error')).toBeInTheDocument();
    expect(screen.getByTestId('description-error')).toHaveTextContent('Description must be at least 10 characters');
  });
});