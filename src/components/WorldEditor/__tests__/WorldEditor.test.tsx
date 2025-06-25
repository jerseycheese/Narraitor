import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useWorldStore } from '@/state/worldStore';
import WorldEditor from '../WorldEditor';

// Mock hooks with simplified behavior
jest.mock('@/hooks', () => ({
  useFormState: jest.fn(),
  useAsyncState: jest.fn(),
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock worldStore
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn(),
  },
}));

// Mock all form components with simple implementations
jest.mock('@/components/forms/WorldBasicInfoForm', () => {
  return function MockWorldBasicInfoForm({ onChange }: { onChange: (updates: any) => void }) {
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

jest.mock('@/components/forms/WorldImageForm', () => {
  return function MockWorldImageForm({ onChange }: { onChange: (updates: any) => void }) {
    return (
      <div data-testid="world-image-form">
        Image Form
        <button onClick={() => onChange({ imageUrl: 'new-image.jpg' })}>
          Update Image
        </button>
      </div>
    );
  };
});

jest.mock('@/components/forms/WorldAttributesForm', () => {
  return function MockWorldAttributesForm({ onChange }: { onChange: (attributes: any) => void }) {
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
  return function MockWorldSkillsForm({ onChange }: { onChange: (skills: any) => void }) {
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
  return function MockWorldSettingsForm({ onChange }: { onChange: (settings: any) => void; onToneSettingsChange: (toneSettings: any) => void }) {
    return (
      <div data-testid="world-settings-form">
        Settings Form
        <button onClick={() => onChange({ maxAttributes: 10 })}>
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
    toneSettings: {
      tone: 'neutral'
    }
  };

  const mockUpdateWorld = jest.fn();
  const mockFormState = {
    data: { world: mockWorld },
    updateField: jest.fn(),
  };
  const mockLoadingState = {
    isLoading: false,
    error: null,
    execute: jest.fn(),
  };
  const mockSaveState = {
    isLoading: false,
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Configure hook mocks
    const { useFormState, useAsyncState } = jest.requireMock('@/hooks');
    useFormState.mockReturnValue(mockFormState);
    useAsyncState
      .mockReturnValueOnce(mockLoadingState)  // First call for loadingState
      .mockReturnValueOnce(mockSaveState);    // Second call for saveState
    
    // Reset mock state
    mockFormState.data = { world: mockWorld };
    mockLoadingState.isLoading = false;
    mockLoadingState.error = null;
    mockSaveState.isLoading = false;
    
    (useWorldStore.getState as jest.Mock).mockReturnValue({
      worlds: {
        'world-123': mockWorld,
      },
      updateWorld: mockUpdateWorld,
    });
  });

  // Acceptance Criteria: Selecting a world allows viewing/editing its details via the WorldEditor
  test('displays all editing forms when world is loaded', () => {
    render(<WorldEditor worldId="world-123" />);

    // Should display all form sections
    expect(screen.getByTestId('world-basic-info-form')).toBeInTheDocument();
    expect(screen.getByTestId('world-image-form')).toBeInTheDocument();
    expect(screen.getByTestId('world-attributes-form')).toBeInTheDocument();
    expect(screen.getByTestId('world-skills-form')).toBeInTheDocument();
    expect(screen.getByTestId('world-settings-form')).toBeInTheDocument();
  });

  // Acceptance Criteria: The WorldEditor provides forms to modify basic info, attributes, and skills
  test('provides save and cancel actions', () => {
    render(<WorldEditor worldId="world-123" />);

    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  // Acceptance Criteria: Changes are saved automatically or with an explicit save action
  test('saves changes when save button is clicked', () => {
    render(<WorldEditor worldId="world-123" />);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Should execute save operation
    expect(mockSaveState.execute).toHaveBeenCalled();
  });

  // Test for cancel functionality
  test('navigates back when cancel button is clicked', () => {
    render(<WorldEditor worldId="world-123" />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Should navigate back without saving
    expect(mockPush).toHaveBeenCalledWith('/worlds');
    expect(mockUpdateWorld).not.toHaveBeenCalled();
  });

  // Test error handling when world not found
  test('shows error message when world is not found', () => {
    // Set up error state
    mockFormState.data = { world: null };
    mockLoadingState.error = 'World not found';

    render(<WorldEditor worldId="non-existent" />);

    expect(screen.getByText('World not found')).toBeInTheDocument();
    expect(screen.getByText('Return to Worlds')).toBeInTheDocument();
  });

  // Test loading state
  test('shows loading message when world is loading', () => {
    // Set up loading state
    mockLoadingState.isLoading = true;
    mockFormState.data = { world: null };

    render(<WorldEditor worldId="world-123" />);

    expect(screen.getByText('Loading world data...')).toBeInTheDocument();
  });

  // Test form interactions
  test('handles form changes correctly', () => {
    render(<WorldEditor worldId="world-123" />);

    // Interact with a form
    const updateNameButton = screen.getByText('Update Name');
    fireEvent.click(updateNameButton);

    // Should update form state
    expect(mockFormState.updateField).toHaveBeenCalledWith('world', expect.objectContaining({
      name: 'Updated Name'
    }));
  });

  // Test button states during save
  test('shows correct button states during save operation', () => {
    // Set up saving state
    mockSaveState.isLoading = true;
    
    render(<WorldEditor worldId="world-123" />);

    const saveButton = screen.getByText('Saving...');
    const cancelButton = screen.getByText('Cancel');

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });
});
