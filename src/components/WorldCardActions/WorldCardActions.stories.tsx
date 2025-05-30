import type { Meta, StoryObj } from '@storybook/react';
import WorldCardActions from './WorldCardActions';

// Mock router for Storybook
const MockWorldCardActions = (props: Parameters<typeof WorldCardActions>[0]) => {
  const mockRouter = {
    push: (url: string) => {
      console.log(`[Storybook] Would navigate to: ${url}`);
      return Promise.resolve();
    }
  };
  
  return (
    <div className="max-w-xs">
      <WorldCardActions {...props} />
    </div>
  );
};

const meta = {
  title: 'Narraitor/World/Display/WorldCardActions',
  component: MockWorldCardActions,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
        Action buttons for world cards that adapt based on world state:
        
        **Active World Actions:**
        - Create Character (green, navigates to character creation)
        - Play (blue, starts game session)
        - Edit (secondary)
        - Delete (secondary)
        
        **Inactive World Actions:**
        - Make Active World (primary green button)
        - Edit (secondary)
        - Delete (secondary)
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether the world is currently active'
    },
    worldId: {
      control: 'text',
      description: 'World ID for navigation'
    },
    onPlay: { action: 'play clicked' },
    onEdit: { action: 'edit clicked' },
    onDelete: { action: 'delete clicked' },
    onMakeActive: { action: 'make active clicked' },
  },
} satisfies Meta<typeof MockWorldCardActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveWorld: Story = {
  args: {
    worldId: 'world-123',
    isActive: true,
    onPlay: () => console.log('Play clicked'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onMakeActive: () => console.log('Make active clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Actions for an active world: shows Create Character + Play buttons in primary row, Edit/Delete in secondary row'
      }
    }
  }
};

export const InactiveWorld: Story = {
  args: {
    worldId: 'world-456',
    isActive: false,
    onPlay: () => console.log('Play clicked'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onMakeActive: () => console.log('Make active clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Actions for an inactive world: shows Make Active World button in primary row, Edit/Delete in secondary row'
      }
    }
  }
};

export const WithoutWorldId: Story = {
  args: {
    worldId: undefined,
    isActive: false,
    onPlay: () => console.log('Play clicked'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onMakeActive: () => console.log('Make active clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case: without worldId, Create Character button is disabled/non-functional'
      }
    }
  }
};
