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
        variant: 'primary',
        className: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        key: 'edit',
        text: 'Edit',
        onClick: () => console.log('Edit clicked'),
        variant: 'primary',
        className: 'bg-blue-600 hover:bg-blue-700',
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
        className: 'bg-blue-600 hover:bg-blue-700',
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
            variant: 'primary',
            className: 'bg-blue-600 hover:bg-blue-700',
          },
          {
            key: 'edit',
            text: 'Edit',
            onClick: () => console.log('Edit'),
            variant: 'primary',
            className: 'bg-blue-600 hover:bg-blue-700',
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
