import type { Meta, StoryObj } from '@storybook/react';
import { CardActionGroup } from './CardActionGroup';

const meta = {
  title: 'Narraitor/Shared/Cards/CardActionGroup',
  component: CardActionGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: { type: 'radio' },
      options: ['horizontal', 'vertical'],
      description: 'Layout direction',
    },
    gap: {
      control: { type: 'radio' },
      options: ['sm', 'md', 'lg'],
      description: 'Gap between buttons',
    },
  },
} satisfies Meta<typeof CardActionGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    primaryActions: [
      {
        key: 'view',
        text: 'View',
        onClick: () => console.log('View clicked'),
        variant: 'primary',
      },
      {
        key: 'edit',
        text: 'Edit',
        onClick: () => console.log('Edit clicked'),
        variant: 'primary',
      },
    ],
    secondaryActions: [
      {
        key: 'delete',
        text: 'Delete',
        onClick: () => console.log('Delete clicked'),
        variant: 'danger',
      },
    ],
  },
};

export const WorldCardActions: Story = {
  args: {
    primaryActions: [
      {
        key: 'create',
        text: 'Create Character',
        onClick: () => console.log('Create character clicked'),
        variant: 'primary',
        className: 'bg-green-600 hover:bg-green-700',
        flex: true,
      },
      {
        key: 'play',
        text: 'Play',
        onClick: () => console.log('Play clicked'),
        variant: 'primary',
        className: 'bg-indigo-600 hover:bg-indigo-700',
        flex: true,
      },
    ],
    secondaryActions: [
      {
        key: 'view',
        text: 'View',
        onClick: () => console.log('View clicked'),
        variant: 'secondary',
      },
      {
        key: 'edit',
        text: 'Edit',
        onClick: () => console.log('Edit clicked'),
        variant: 'secondary',
      },
      {
        key: 'delete',
        text: 'Delete',
        onClick: () => console.log('Delete clicked'),
        variant: 'danger',
      },
    ],
  },
};

export const CharacterCardActions: Story = {
  args: {
    primaryActions: [
      {
        key: 'view',
        text: 'View',
        onClick: () => console.log('View character clicked'),
        variant: 'primary',
        className: 'bg-green-600 hover:bg-green-700',
      },
      {
        key: 'play',
        text: 'Play',
        onClick: () => console.log('Play as character clicked'),
        variant: 'primary',
        className: 'bg-indigo-600 hover:bg-indigo-700',
      },
      {
        key: 'edit',
        text: 'Edit',
        onClick: () => console.log('Edit character clicked'),
        variant: 'primary',
        className: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        key: 'delete',
        text: 'Delete',
        onClick: () => console.log('Delete character clicked'),
        variant: 'danger',
      },
    ],
  },
};

export const WithIcons: Story = {
  args: {
    primaryActions: [
      {
        key: 'view',
        text: 'View',
        onClick: () => console.log('View clicked'),
        variant: 'primary',
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
      },
      {
        key: 'edit',
        text: 'Edit',
        onClick: () => console.log('Edit clicked'),
        variant: 'primary',
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
      },
    ],
    secondaryActions: [
      {
        key: 'delete',
        text: 'Delete',
        onClick: () => console.log('Delete clicked'),
        variant: 'danger',
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
      },
    ],
  },
};

export const VerticalLayout: Story = {
  args: {
    layout: 'vertical',
    primaryActions: [
      {
        key: 'primary1',
        text: 'Primary Action 1',
        onClick: () => console.log('Primary 1 clicked'),
        variant: 'primary',
      },
      {
        key: 'primary2',
        text: 'Primary Action 2',
        onClick: () => console.log('Primary 2 clicked'),
        variant: 'primary',
      },
    ],
    secondaryActions: [
      {
        key: 'secondary1',
        text: 'Secondary Action',
        onClick: () => console.log('Secondary clicked'),
        variant: 'secondary',
      },
      {
        key: 'danger1',
        text: 'Danger Action',
        onClick: () => console.log('Danger clicked'),
        variant: 'danger',
      },
    ],
  },
};

export const SmallGap: Story = {
  args: {
    gap: 'sm',
    primaryActions: [
      {
        key: 'action1',
        text: 'Action 1',
        onClick: () => console.log('Action 1'),
        variant: 'primary',
      },
      {
        key: 'action2',
        text: 'Action 2',
        onClick: () => console.log('Action 2'),
        variant: 'primary',
      },
      {
        key: 'action3',
        text: 'Action 3',
        onClick: () => console.log('Action 3'),
        variant: 'secondary',
      },
    ],
  },
};

export const LargeGap: Story = {
  args: {
    gap: 'lg',
    primaryActions: [
      {
        key: 'action1',
        text: 'Action 1',
        onClick: () => console.log('Action 1'),
        variant: 'primary',
      },
      {
        key: 'action2',
        text: 'Action 2',
        onClick: () => console.log('Action 2'),
        variant: 'primary',
      },
    ],
  },
};

export const InCardContext: Story = {
  render: () => (
    <div className="w-96 border border-gray-300 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-2">Sample World</h3>
      <p className="text-gray-600 mb-4">
        A fantasy medieval world with magic and dragons.
      </p>
      <CardActionGroup
        primaryActions={[
          {
            key: 'create',
            text: 'Create Character',
            onClick: () => console.log('Create character'),
            variant: 'primary',
            className: 'bg-green-600 hover:bg-green-700',
            flex: true,
          },
          {
            key: 'play',
            text: 'Play',
            onClick: () => console.log('Play'),
            variant: 'primary',
            className: 'bg-indigo-600 hover:bg-indigo-700',
            flex: true,
          },
        ]}
        secondaryActions={[
          {
            key: 'view',
            text: 'View',
            onClick: () => console.log('View'),
            variant: 'secondary',
          },
          {
            key: 'edit',
            text: 'Edit',
            onClick: () => console.log('Edit'),
            variant: 'secondary',
          },
          {
            key: 'delete',
            text: 'Delete',
            onClick: () => console.log('Delete'),
            variant: 'danger',
          },
        ]}
      />
    </div>
  ),
};