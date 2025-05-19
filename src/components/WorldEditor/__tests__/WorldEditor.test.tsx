import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { worldStore } from '@/state/worldStore';
import WorldEditor from '../WorldEditor';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock worldStore
jest.mock('@/state/worldStore', () => ({
  worldStore: {
    getState: jest.fn(),
  },
}));

// Mock child components
jest.mock('@/components/forms/WorldBasicInfoForm', () => {
  return function MockWorldBasicInfoForm({ world, onChange }: any) {
    return (
      <div data-testid="world-basic-info-form">
        Basic Info Form
        <button onClick={() => onChange({ name: 'Updated Name' })}>
          Update Name
        </button>
      </div>
    );
  };
});

jest.mock('@/components/forms/WorldAttributesForm', () => {
  return function MockWorldAttributesForm({ attributes, onChange }: any) {
    return (
      <div data-testid="world-attributes-form">
        Attributes Form
        <button onClick={() => onChange([])}>
          Update Attributes
        </button>
      </div>
    );
  };
});

jest.mock('@/components/forms/WorldSkillsForm', () => {
  return function MockWorldSkillsForm({ skills, onChange }: any) {
    return (
      <div data-testid="world-skills-form">
        Skills Form
        <button onClick={() => onChange([])}>
          Update Skills
        </button>
      </div>
    );
  };
});

jest.mock('@/components/forms/WorldSettingsForm', () => {
  return function MockWorldSettingsForm({ settings, onChange }: any) {
    return (
      <div data-testid="world-settings-form">
        Settings Form
        <button onClick={() => onChange(settings)}>
          Update Settings
        </button>
      </div>
    );
  };
});

describe('WorldEditor - MVP Level Tests', () => {
  const mockWorld = {
    id: 'world-123',
    name: 'Test World',
    description: 'A test world',
    theme: 'Fantasy',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 20,
      attributePointPool: 25,
      skillPointPool: 30,
    },
  };

  const mockUpdateWorld = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (worldStore.getState as jest.Mock).mockReturnValue({
      worlds: {
        'world-123': mockWorld,
      },
      updateWorld: mockUpdateWorld,
    });
  });

  // Acceptance Criteria: Selecting a world allows viewing/editing its details via the WorldEditor
  test('loads and displays world data for editing', async () => {
    render(<WorldEditor worldId="world-123" />);

    // Should display all form sections immediately since we're using synchronous store access
    await waitFor(() => {
      expect(screen.getByTestId('world-basic-info-form')).toBeInTheDocument();
      expect(screen.getByTestId('world-attributes-form')).toBeInTheDocument();
      expect(screen.getByTestId('world-skills-form')).toBeInTheDocument();
      expect(screen.getByTestId('world-settings-form')).toBeInTheDocument();
    });
  });

  // Acceptance Criteria: The WorldEditor provides forms to modify basic info, attributes, and skills
  test('provides forms for modifying all world aspects', async () => {
    render(<WorldEditor worldId="world-123" />);

    await waitFor(() => {
      // Basic info form is present
      expect(screen.getByTestId('world-basic-info-form')).toBeInTheDocument();
      
      // Attributes form is present
      expect(screen.getByTestId('world-attributes-form')).toBeInTheDocument();
      
      // Skills form is present
      expect(screen.getByTestId('world-skills-form')).toBeInTheDocument();
      
      // Settings form is present
      expect(screen.getByTestId('world-settings-form')).toBeInTheDocument();
    });
  });

  // Acceptance Criteria: Changes are saved automatically or with an explicit save action
  test('saves changes when save button is clicked', async () => {
    render(<WorldEditor worldId="world-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('world-basic-info-form')).toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Should call updateWorld with correct data
    await waitFor(() => {
      expect(mockUpdateWorld).toHaveBeenCalledWith('world-123', mockWorld);
    });

    // Should navigate back to worlds list
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/worlds');
    });
  });

  // Test for cancel functionality
  test('cancels editing and returns to worlds list', async () => {
    render(<WorldEditor worldId="world-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('world-basic-info-form')).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Should navigate back without saving
    expect(mockPush).toHaveBeenCalledWith('/worlds');
    expect(mockUpdateWorld).not.toHaveBeenCalled();
  });

  // Test error handling when world not found
  test('shows error when world is not found', async () => {
    (worldStore.getState as jest.Mock).mockReturnValue({
      worlds: {},
      updateWorld: mockUpdateWorld,
    });

    render(<WorldEditor worldId="non-existent" />);

    await waitFor(() => {
      expect(screen.getByText(/World not found/i)).toBeInTheDocument();
    });

    // Should provide a way to return to worlds list
    const returnButton = screen.getByText('Return to Worlds');
    expect(returnButton).toBeInTheDocument();
  });

  // Test form state management
  test('updates state when form sections change', async () => {
    render(<WorldEditor worldId="world-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('world-basic-info-form')).toBeInTheDocument();
    });

    // Update basic info
    const updateNameButton = screen.getByText('Update Name');
    fireEvent.click(updateNameButton);

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Should save with updated data
    await waitFor(() => {
      expect(mockUpdateWorld).toHaveBeenCalledWith(
        'world-123',
        expect.objectContaining({
          name: 'Updated Name',
        })
      );
    });
  });

  // Test save button state during save operation
  test('disables save and cancel buttons while saving', async () => {
    render(<WorldEditor worldId="world-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('world-basic-info-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    const cancelButton = screen.getByText('Cancel');

    // Click save
    fireEvent.click(saveButton);

    // Buttons should be disabled during save
    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(saveButton).toHaveTextContent('Saving...');
  });
});