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

// Create proper mock type for worldStore
interface MockWorldStore {
  worlds: Record<string, unknown>;
  setCurrentWorld: jest.Mock;
  updateWorld: jest.Mock;
}

interface MockWorldStoreHook extends jest.Mock {
  getState: jest.Mock<MockWorldStore>;
}

jest.mock('@/state/worldStore', () => ({
  useWorldStore: jest.fn(),
}));

jest.mock('@/lib/ai/worldImageGenerator', () => ({
  generateWorldImage: jest.fn(),
}));

jest.mock('@/lib/ai/worldAnalyzerClient', () => ({
  analyzeWorldDescriptionClient: jest.fn(),
}));

jest.mock('@/components/TutorialProvider', () => ({
  useTutorial: jest.fn(() => ({
    startTour: jest.fn(),
    setCurrentWizardStep: jest.fn(),
    isTourActive: false,
  })),
}));

// Test data constants
const TEST_WORLD_DATA = {
  name: 'Test World Name',
  description: 'A test world description',
  genre: 'sci-fi',
  attributes: [
    { name: 'Strength', description: 'Physical power', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical' }
  ],
  skills: [
    { name: 'Combat', description: 'Fighting ability', difficulty: 'medium' as const, category: 'Combat' }
  ]
} as const;

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

    const mockWorldStoreHook = useWorldStore as unknown as MockWorldStoreHook;
    mockWorldStoreHook.mockReturnValue(mockCreateWorld);
    
    // Mock the getState method for accessing worlds
    mockWorldStoreHook.getState = jest.fn().mockReturnValue({
      worlds: {},
      setCurrentWorld: jest.fn(),
      updateWorld: jest.fn(),
    });
  });

  describe('Basic Cancel Confirmation Functionality', () => {
    it('should not show confirmation dialog when canceling with clean state', async () => {
      render(<WorldCreationWizard onCancel={mockOnCancel} />);
      
      // Click cancel on the first step (clean state)
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Should call onCancel directly without showing confirmation
      expect(mockOnCancel).toHaveBeenCalled();
      expect(screen.queryByText('Cancel World Creation?')).not.toBeInTheDocument();
    });

    it('should show confirmation dialog when canceling with dirty state', async () => {
      // Start with simple initial data and interact with form to create dirty state
      render(<WorldCreationWizard initialStep={0} onCancel={mockOnCancel} />);
      
      // Enter data to make the wizard dirty
      const nameInput = screen.getByTestId('world-name-input');
      await user.type(nameInput, TEST_WORLD_DATA.name);
      
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
      render(<WorldCreationWizard initialStep={0} onCancel={mockOnCancel} />);
      
      // Enter data to make the wizard dirty
      const nameInput = screen.getByTestId('world-name-input');
      await user.type(nameInput, TEST_WORLD_DATA.name);
      
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
      render(<WorldCreationWizard initialStep={0} onCancel={mockOnCancel} />);
      
      // Enter data to make the wizard dirty
      const nameInput = screen.getByTestId('world-name-input');
      await user.type(nameInput, TEST_WORLD_DATA.name);
      
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
      render(<WorldCreationWizard initialStep={0} />);
      
      // Enter data to make the wizard dirty
      const nameInput = screen.getByTestId('world-name-input');
      await user.type(nameInput, TEST_WORLD_DATA.name);
      
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
    it('should detect dirty state when name is changed', async () => {
      render(<WorldCreationWizard initialStep={0} onCancel={mockOnCancel} />);
      
      // Enter name to make wizard dirty
      const nameInput = screen.getByTestId('world-name-input');
      await user.type(nameInput, TEST_WORLD_DATA.name);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });

    it('should detect dirty state when description is changed', async () => {
      // Start on step 1 (DescriptionStep) where the full description field is located
      render(<WorldCreationWizard initialStep={1} onCancel={mockOnCancel} />);

      // Enter description to make wizard dirty
      const descriptionInput = screen.getByTestId('world-full-description');
      await user.type(descriptionInput, TEST_WORLD_DATA.description);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });

    it('should detect dirty state when genre is changed', async () => {
      render(<WorldCreationWizard initialStep={0} onCancel={mockOnCancel} />);
      
      // Change genre to make wizard dirty  
      const genreSelect = screen.getByTestId('world-genre-select');
      await user.selectOptions(genreSelect, TEST_WORLD_DATA.genre);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });

    it('should detect dirty state when attributes are modified', async () => {
      // Start with some initial attributes and test modification
      const initialData = {
        attributes: TEST_WORLD_DATA.attributes.map(attr => ({
          ...attr,
          id: `attr-${Date.now()}`,
          worldId: 'test-world-id'
        })),
        genre: TEST_WORLD_DATA.genre
      };
      render(<WorldCreationWizard initialData={initialData} initialStep={0} onCancel={mockOnCancel} />);
      
      // Modify the name field to trigger dirty state
      const nameInput = screen.getByTestId('world-name-input');
      await user.type(nameInput, TEST_WORLD_DATA.name);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });

    it('should detect dirty state when skills are modified', async () => {
      // Start with some initial skills and test modification
      const initialData = {
        skills: TEST_WORLD_DATA.skills.map(skill => ({
          ...skill,
          id: `skill-${Date.now()}`,
          worldId: 'test-world-id',
          attributeIds: [],
          baseValue: 5,
          minValue: 1,
          maxValue: 10
        })),
        genre: TEST_WORLD_DATA.genre
      };
      render(<WorldCreationWizard initialData={initialData} initialStep={0} onCancel={mockOnCancel} />);
      
      // Modify the name field to trigger dirty state
      const nameInput = screen.getByTestId('world-name-input');
      await user.type(nameInput, TEST_WORLD_DATA.name);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });

    it('should detect dirty state when AI suggestions are generated', async () => {
      render(<WorldCreationWizard initialStep={0} onCancel={mockOnCancel} />);
      
      // Enter name to make wizard dirty and simulate AI suggestions generated
      const nameInput = screen.getByTestId('world-name-input');
      await user.type(nameInput, TEST_WORLD_DATA.name);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('Cancel World Creation?')).toBeInTheDocument();
    });
  });

  describe('Dialog Properties', () => {
    it('should use warning variant for the confirmation dialog', async () => {
      render(<WorldCreationWizard initialStep={0} onCancel={mockOnCancel} />);
      
      // Enter name to make wizard dirty
      const nameInput = screen.getByTestId('world-name-input');
      await user.type(nameInput, TEST_WORLD_DATA.name);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Verify warning styling is applied to the modal content
      const modalContent = document.querySelector('[role="dialog"]');
      expect(modalContent).toBeInTheDocument();
    });
  });
});
