import type { Meta, StoryObj } from '@storybook/react';
import { EntityBadge } from './EntityBadge';

const meta = {
  title: 'Narraitor/Shared/Cards/EntityBadge',
  component: EntityBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'radio' },
      options: ['world', 'character', 'item', 'location', 'custom'],
      description: 'The type of entity',
    },
    variant: {
      control: { type: 'radio' },
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info'],
      description: 'Badge color variant',
    },
    size: {
      control: { type: 'radio' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
    },
    text: {
      control: 'text',
      description: 'The text to display in the badge',
    },
    icon: {
      control: 'text',
      description: 'Optional icon to display (emoji or text)',
    },
  },
} satisfies Meta<typeof EntityBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: 'Sample Badge',
  },
};

export const WorldBadges: Story = {
  args: {
    type: 'world',
    text: 'Default Badge',
  },
  render: () => (
    <div className="space-y-2">
      <div>
        <EntityBadge type="world" text="Fantasy World" variant="info" />
      </div>
      <div>
        <EntityBadge type="world" text="Sci-Fi Setting" variant="primary" />
      </div>
      <div>
        <EntityBadge type="world" text="Historical" variant="secondary" />
      </div>
    </div>
  ),
};

export const CharacterBadges: Story = {
  args: {
    type: 'character',
    text: 'Default Character Badge',
  },
  render: () => (
    <div className="space-y-2">
      <div>
        <EntityBadge type="character" text="Known Figure" variant="warning" />
      </div>
      <div>
        <EntityBadge type="character" text="Original Character" variant="success" />
      </div>
      <div>
        <EntityBadge type="character" text="NPC" variant="secondary" />
      </div>
    </div>
  ),
};

export const CustomIcons: Story = {
  args: {
    text: 'Default Icon Badge',
  },
  render: () => (
    <div className="space-y-2">
      <div>
        <EntityBadge text="Premium" icon="💎" variant="warning" />
      </div>
      <div>
        <EntityBadge text="Featured" icon="⭐" variant="success" />
      </div>
      <div>
        <EntityBadge text="New" icon="🆕" variant="info" />
      </div>
      <div>
        <EntityBadge text="Verified" icon="✅" variant="primary" />
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  args: {
    text: 'Default Variant Badge',
  },
  render: () => (
    <div className="space-y-2">
      <div>
        <EntityBadge text="Primary" variant="primary" />
      </div>
      <div>
        <EntityBadge text="Secondary" variant="secondary" />
      </div>
      <div>
        <EntityBadge text="Success" variant="success" />
      </div>
      <div>
        <EntityBadge text="Warning" variant="warning" />
      </div>
      <div>
        <EntityBadge text="Danger" variant="danger" />
      </div>
      <div>
        <EntityBadge text="Info" variant="info" />
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  args: {
    text: 'Default Size Badge',
  },
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <EntityBadge text="Small" size="sm" variant="primary" />
        <EntityBadge text="Medium" size="md" variant="primary" />
        <EntityBadge text="Large" size="lg" variant="primary" />
      </div>
      <div className="flex items-center gap-2">
        <EntityBadge text="Small with icon" icon="🚀" size="sm" variant="success" />
        <EntityBadge text="Medium with icon" icon="🚀" size="md" variant="success" />
        <EntityBadge text="Large with icon" icon="🚀" size="lg" variant="success" />
      </div>
    </div>
  ),
};

export const AllEntityTypes: Story = {
  args: {
    text: 'Default Entity Badge',
  },
  render: () => (
    <div className="space-y-2">
      <div>
        <EntityBadge type="world" text="World Type" />
      </div>
      <div>
        <EntityBadge type="character" text="Character Type" />
      </div>
      <div>
        <EntityBadge type="item" text="Item Type" />
      </div>
      <div>
        <EntityBadge type="location" text="Location Type" />
      </div>
      <div>
        <EntityBadge type="custom" text="Custom Type" />
      </div>
    </div>
  ),
};

export const InContext: Story = {
  args: {
    text: 'Context Badge',
  },
  render: () => (
    <div className="w-80 border border-gray-300 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold">Aragorn</h3>
        <EntityBadge type="character" text="Known Figure" variant="warning" />
      </div>
      <p className="text-gray-600 mb-4">
        A ranger from the North, and heir to the throne of Gondor.
      </p>
      <div className="flex gap-2">
        <EntityBadge text="Ranger" variant="success" size="sm" />
        <EntityBadge text="Hero" variant="primary" size="sm" />
        <EntityBadge text="Leader" variant="info" size="sm" />
      </div>
    </div>
  ),
};

export const BadgeCollection: Story = {
  args: {
    text: 'Collection Badge',
  },
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <EntityBadge type="world" text="Middle Earth" variant="info" />
        <EntityBadge type="character" text="Gandalf" variant="warning" />
        <EntityBadge type="item" text="Ring of Power" variant="danger" />
        <EntityBadge type="location" text="Rivendell" variant="success" />
      </div>
      <div className="flex flex-wrap gap-2">
        <EntityBadge text="Fantasy" variant="primary" size="sm" />
        <EntityBadge text="Epic" variant="warning" size="sm" />
        <EntityBadge text="Adventure" variant="success" size="sm" />
        <EntityBadge text="Magic" variant="info" size="sm" />
      </div>
    </div>
  ),
};
