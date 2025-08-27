import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import WorldCreationWizard from '../WorldCreationWizard';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: jest.fn(),
}));

jest.mock('@/lib/ai', () => ({
  createAIClient: jest.fn(),
}));

jest.mock('@/lib/ai/worldImageGenerator', () => ({
  WorldImageGenerator: jest.fn(),
}));

jest.mock('@/lib/ai/worldAnalyzerClient', () => ({
  analyzeWorldDescriptionClient: jest.fn(),
}));

describe('WorldCreationWizard Cancel Confirmation', () => {
  const mockPush = jest.fn();
  const mockCreateWorld = jest.fn();
  const mockOnCancel = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useWorldStore as jest.Mock).mockReturnValue(mockCreateWorld);
    
    // Mock the getState method for accessing worlds
    (useWorldStore as unknown as { getState: jest.Mock }).getState = jest.fn().mockReturnValue({
      worlds: {},
      setCurrentWorld: jest.fn(),
      updateWorld: jest.fn(),
    });
  });

  describe('Basic Cancel Confirmation Functionality', () => {
    it('should not show confirmation dialog when canceling with clean state', async () => {
      render(<WorldCreationWizard onCancel={mockOnCancel} />);
      
      // Click cancel on template step (clean state)
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Should call onCancel directly without showing confirmation
      expect(mockOnCancel).toHaveBeenCalled();
      expect(screen.queryByText('Cancel World Creation?')).not.toBeInTheDocument();
    });

    it('should show confirmation dialog when canceling with dirty state', async () => {
      // Start with dirty initial data
      const initialData = {
        createOwnWorld: true,
        name: 'Test World Name', // This makes it dirty
      };
      
      render(<WorldCreationWizard initialData={initialData} initialStep={1} onCancel={mockOnCancel} />);
      
      // Click cancel - should show confirmation due to dirty state
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Should show confirmation dialog
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
      expect(screen.getByText('Your progress will be lost. Are you sure you want to cancel?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /yes, cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue editing/i })).toBeInTheDocument();
      
      // Should NOT call onCancel yet
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should proceed with cancellation when user confirms', async () => {
      const initialData = {
        createOwnWorld: true,
        name: 'Test World Name',
      };
      
      render(<WorldCreationWizard initialData={initialData} initialStep={1} onCancel={mockOnCancel} />);
      
      // Click cancel to show confirmation
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Click "Yes, Cancel" to confirm
      const yesButton = screen.getByRole('button', { name: /yes, cancel/i });
      await user.click(yesButton);
      
      // Should call onCancel
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should continue editing when user rejects confirmation', async () => {
      const initialData = {
        createOwnWorld: true,
        name: 'Test World Name',
      };
      
      render(<WorldCreationWizard initialData={initialData} initialStep={1} onCancel={mockOnCancel} />);
      
      // Click cancel to show confirmation
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Click "Continue Editing" to reject
      const continueButton = screen.getByRole('button', { name: /continue editing/i });
      await user.click(continueButton);
      
      // Dialog should close and user should remain in wizard
      expect(screen.queryByText('Cancel World Creation?')).not.toBeInTheDocument();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should use router.push when no onCancel prop is provided', async () => {
      const initialData = {
        createOwnWorld: true,
        name: 'Test World Name',
      };
      
      render(<WorldCreationWizard initialData={initialData} initialStep={1} />);
      
      // Click cancel to show confirmation
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Confirm cancellation
      const yesButton = screen.getByRole('button', { name: /yes, cancel/i });
      await user.click(yesButton);
      
      // Should navigate to worlds page
      expect(mockPush).toHaveBeenCalledWith('/worlds');
    });
  });

  describe('Dirty State Detection', () => {
    it('should detect dirty state when name is provided', async () => {
      const initialData = { name: 'Test World' };
      render(<WorldCreationWizard initialData={initialData} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });

    it('should detect dirty state when description is provided', async () => {
      const initialData = { description: 'A test world description' };
      render(<WorldCreationWizard initialData={initialData} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });

    it('should detect dirty state when genre is provided', async () => {
      const initialData = { genre: 'Fantasy' };
      render(<WorldCreationWizard initialData={initialData} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });

    it('should detect dirty state when attributes are provided', async () => {
      const initialData = {
        attributes: [
          { name: 'Strength', description: 'Physical power', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical' }
        ]
      };
      render(<WorldCreationWizard initialData={initialData} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });

    it('should detect dirty state when skills are provided', async () => {
      const initialData = {
        skills: [
          { name: 'Combat', description: 'Fighting ability', difficulty: 'medium' as const, category: 'Combat' }
        ]
      };
      render(<WorldCreationWizard initialData={initialData} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });

    it('should detect dirty state when AI suggestions are generated', async () => {
      const initialData = { aiSuggestionsGenerated: true };
      render(<WorldCreationWizard initialData={initialData} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });
  });

  describe('Dialog Properties', () => {
    it('should use warning variant for the confirmation dialog', async () => {
      const initialData = { name: 'Test World' };
      render(<WorldCreationWizard initialData={initialData} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Verify warning styling is applied
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('border-yellow-200', 'bg-yellow-50');
    });
  });
});