import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { World } from '../../types/world.types';
import MockWorldList from '../WorldList/MockWorldList'; // Import instead of actual WorldList
import DeleteConfirmationDialog from '../DeleteConfirmationDialog/DeleteConfirmationDialog';

// Mock worlds data
const mockWorlds: World[] = [
  {
    id: '1',
    name: 'Fantasy Realm',
    description: 'A magical world full of wonder',
    theme: 'Fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 100,
      skillPointPool: 100,
    },
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Sci-Fi Universe',
    description: 'A futuristic world of technology',
    theme: 'Sci-Fi',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 100,
      skillPointPool: 100,
    },
    createdAt: '2023-01-02T10:00:00Z',
    updatedAt: '2023-01-02T10:00:00Z',
  },
];

// Create a mock version of WorldListScreen for Storybook
const MockWorldListScreen = ({ 
  worlds = mockWorlds, 
  loading = false, 
  error = null 
}: { 
  worlds?: World[]; 
  loading?: boolean; 
  error?: string | null;
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [worldToDeleteId, setWorldToDeleteId] = React.useState<string | null>(null);

  const handleSelectWorld = (worldId: string) => {
    console.log('Selected world:', worldId);
  };

  const handleDeleteClick = (worldId: string) => {
    setWorldToDeleteId(worldId);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setWorldToDeleteId(null);
  };

  const handleConfirmDelete = () => {
    if (worldToDeleteId) {
      console.log('Deleted world:', worldToDeleteId);
    }
    handleCloseDeleteDialog();
  };

  const worldToDelete = worlds.find((world) => world.id === worldToDeleteId);
  const deleteMessage = worldToDelete
    ? `Are you sure you want to delete the world "${worldToDelete.name}"?`
    : 'Are you sure you want to delete this world?';

  if (loading) {
    return <div data-testid="world-list-screen-loading-indicator">Loading worlds...</div>;
  }

  if (error) {
    return <div data-testid="world-list-screen-error-message">Error: {error}</div>;
  }

  return (
    <div>
      <MockWorldList 
        worlds={worlds} 
        onSelectWorld={handleSelectWorld} 
        onDeleteWorld={handleDeleteClick}
        onPlayWorld={(worldId) => console.log('Play world:', worldId)} 
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        message={deleteMessage}
      />
    </div>
  );
};

const meta = {
  title: 'Narraitor/World/WorldListScreen',
  component: MockWorldListScreen,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Main screen for displaying and managing worlds'
      }
    }
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockWorldListScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    worlds: mockWorlds,
    loading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    worlds: [],
    loading: true,
    error: null,
  },
};

export const Error: Story = {
  args: {
    worlds: [],
    loading: false,
    error: 'Failed to load worlds',
  },
};

export const Empty: Story = {
  args: {
    worlds: [],
    loading: false,
    error: null,
  },
};