import type { Meta, StoryObj } from '@storybook/react';
import { CardActionGroup } from '@/components/shared/cards/CardActionGroup';

const meta = {
  title: '02-Molecules/ui-components/cards/CardActionGroup',
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
        className: '',
        flex: true,
      },
      {
        key: 'play',
        text: 'Play',
        onClick: () => console.log('Play clicked'),
        variant: 'success',
        flex: true,
      },
    ],
    secondaryActions: [
      {
        key: 'view',
        text: 'View',
        onClick: () => console.log('View clicked'),
        variant: 'primary',
        className: '',
      },
      {
        key: 'edit',
        text: 'Edit',
        onClick: () => console.log('Edit clicked'),
        variant: 'primary',
        className: '',
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
        className: '',
      },
      {
        key: 'play',
        text: 'Play',
        onClick: () => console.log('Play as character clicked'),
        variant: 'success',
      },
      {
        key: 'edit',
        text: 'Edit',
        onClick: () => console.log('Edit character clicked'),
        variant: 'primary',
        className: '',
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
    <div>
      <h3>Sample World</h3>
      <p>
        A fantasy medieval world with magic and dragons.
      </p>
      <CardActionGroup
        primaryActions={[
          {
            key: 'create',
            text: 'Create Character',
            onClick: () => console.log('Create character'),
            variant: 'primary',
            className: '',
            flex: true,
          },
          {
            key: 'play',
            text: 'Play',
            onClick: () => console.log('Play'),
            variant: 'success',
            flex: true,
          },
        ]}
        secondaryActions={[
          {
            key: 'view',
            text: 'View',
            onClick: () => console.log('View'),
            variant: 'primary',
            className: '',
          },
          {
            key: 'edit',
            text: 'Edit',
            onClick: () => console.log('Edit'),
            variant: 'primary',
            className: '',
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
