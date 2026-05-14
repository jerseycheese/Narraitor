import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useWorldStore } from '@/state/worldStore';
import WorldEditor from '../WorldEditor';
import { mockZustandStore, createMockWorldStore } from '@/lib/test-utils';
import type { World } from '@/types/world.types';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock worldStore
jest.mock('@/state/worldStore');

interface MockBasicInfoFormProps {
  world: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onChange: (updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface MockAttributesFormProps {
  attributes: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onChange: (attributes: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface MockSkillsFormProps {
  skills: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onChange: (skills: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface MockSettingsFormProps {
  settings: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onChange: (settings: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Mock child components
jest.mock('@/components/forms/WorldBasicInfoForm', () => {
  return function MockWorldBasicInfoForm({ onChange }: MockBasicInfoFormProps) {
    return (
      <div>
        Basic Info Form
        <button onClick={() => onChange({ name: 'Updated Name' })}>
          Update Name
        </button>
      </div>
    );
  };
});

jest.mock('@/components/forms/WorldAttributesForm', () => {
  return function MockWorldAttributesForm({
    onChange,
  }: MockAttributesFormProps) {
    return (
      <div>
        Attributes Form
        <button onClick={() => onChange([])}>Update Attributes</button>
      </div>
    );
  };
});

jest.mock('@/components/forms/WorldSkillsForm', () => {
  return function MockWorldSkillsForm({ onChange }: MockSkillsFormProps) {
    return (
      <div>
        Skills Form
        <button onClick={() => onChange([])}>Update Skills</button>
      </div>
    );
  };
});

jest.mock('@/components/forms/WorldSettingsForm', () => {
  return function MockWorldSettingsForm({
    settings,
    onChange,
  }: MockSettingsFormProps) {
    return (
      <div>
        Settings Form
        <button onClick={() => onChange(settings)}>Update Settings</button>
      </div>
    );
  };
});

describe('WorldEditor - MVP Level Tests', () => {
  const mockWorld = {
    id: 'world-123',
    name: 'Test World',
    description: 'A test world',
    genre: 'fantasy',
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
  } satisfies World;

  const mockUpdateWorld = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateWorld.mockClear();

    mockZustandStore(
      useWorldStore as jest.MockedFunction<typeof useWorldStore>,
      createMockWorldStore({
        worlds: {
          'world-123': mockWorld,
        },
        fetchWorlds: jest.fn().mockResolvedValue(undefined),
        updateWorld: mockUpdateWorld,
      })
    );
  });

  // Acceptance Criteria: Selecting a world allows viewing/editing its details via the WorldEditor
  test('loads and displays world data for editing', async () => {
    render(<WorldEditor worldId="world-123" />);

    // Should display all form sections immediately since we're using synchronous store access
    await waitFor(() => {
      expect(screen.getByText('Basic Info Form')).toBeInTheDocument();
      expect(screen.getByText('Attributes Form')).toBeInTheDocument();
      expect(screen.getByText('Skills Form')).toBeInTheDocument();
      expect(screen.getByText('Settings Form')).toBeInTheDocument();
    });
  });

  // Acceptance Criteria: The WorldEditor provides forms to modify basic info, attributes, and skills
  test('provides forms for modifying all world aspects', async () => {
    render(<WorldEditor worldId="world-123" />);

    await waitFor(() => {
      // Basic info form is present
      expect(screen.getByText('Basic Info Form')).toBeInTheDocument();

      // Attributes form is present
      expect(screen.getByText('Attributes Form')).toBeInTheDocument();

      // Skills form is present
      expect(screen.getByText('Skills Form')).toBeInTheDocument();

      // Settings form is present
      expect(screen.getByText('Settings Form')).toBeInTheDocument();
    });
  });

  // Acceptance Criteria: Changes are saved automatically or with an explicit save action
  test('saves changes when save button is clicked', async () => {
    render(<WorldEditor worldId="world-123" />);

    await waitFor(() => {
      expect(screen.getByText('Basic Info Form')).toBeInTheDocument();
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
      expect(screen.getByText('Basic Info Form')).toBeInTheDocument();
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
    mockZustandStore(
      useWorldStore as jest.MockedFunction<typeof useWorldStore>,
      createMockWorldStore({
        worlds: {
          'world-456': mockWorld, // Different world ID
        },
        fetchWorlds: jest.fn().mockResolvedValue(undefined),
        updateWorld: mockUpdateWorld,
      })
    );

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
      expect(screen.getByText('Basic Info Form')).toBeInTheDocument();
    });

    // Update basic info
    const updateNameButton = screen.getByText('Update Name');
    fireEvent.click(updateNameButton);

    // Save changes - wait for save button to appear after form change
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeInTheDocument();
    });
    const saveButton = screen.getByRole('button', { name: /save changes/i });
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
      expect(screen.getByText('Basic Info Form')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    const cancelButton = screen.getByText('Cancel');

    // Click save
    fireEvent.click(saveButton);

    // Re-query after label switches to 'Saving...' (label change remounts the button)
    await waitFor(() => {
      const savingButton = screen.getByText('Saving...');
      expect(savingButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });
});
