import type { Meta, StoryObj } from '@storybook/react';
import { ChunkRevealButton } from './ChunkRevealButton';

const meta: Meta<typeof ChunkRevealButton> = {
  title: 'Narrative/ChunkRevealButton',
  component: ChunkRevealButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Button component for revealing more narrative content chunks in a progressive disclosure pattern. Shows remaining content and provides visual feedback.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
    remainingChunks: {
      control: { type: 'number', min: 0, max: 20 },
      description: 'Number of remaining chunks to reveal',
    },
    totalChunks: {
      control: { type: 'number', min: 1, max: 30 },
      description: 'Total number of chunks',
    },
    text: {
      control: 'text',
      description: 'Button text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChunkRevealButton>;

export const Default: Story = {
  args: {
    onClick: () => console.log('Reveal next chunk'),
    remainingChunks: 5,
    totalChunks: 10,
  },
};

export const FewRemaining: Story = {
  args: {
    onClick: () => console.log('Reveal next chunk'),
    remainingChunks: 2,
    totalChunks: 8,
  },
};

export const ManyRemaining: Story = {
  args: {
    onClick: () => console.log('Reveal next chunk'),
    remainingChunks: 15,
    totalChunks: 20,
  },
};

export const LastOne: Story = {
  args: {
    onClick: () => console.log('Reveal next chunk'),
    remainingChunks: 1,
    totalChunks: 10,
  },
};

export const NoProgress: Story = {
  args: {
    onClick: () => console.log('Reveal next chunk'),
  },
};

export const CustomText: Story = {
  args: {
    onClick: () => console.log('Reveal next chunk'),
    text: 'Show More Story',
    remainingChunks: 3,
    totalChunks: 8,
  },
};

export const Disabled: Story = {
  args: {
    onClick: () => console.log('Reveal next chunk'),
    remainingChunks: 5,
    totalChunks: 10,
    disabled: true,
  },
};

export const OutlineVariant: Story = {
  args: {
    onClick: () => console.log('Reveal next chunk'),
    remainingChunks: 5,
    totalChunks: 10,
    variant: 'outline',
  },
};

export const SecondaryVariant: Story = {
  args: {
    onClick: () => console.log('Reveal next chunk'),
    remainingChunks: 5,
    totalChunks: 10,
    variant: 'secondary',
  },
};

export const GhostVariant: Story = {
  args: {
    onClick: () => console.log('Reveal next chunk'),
    remainingChunks: 5,
    totalChunks: 10,
    variant: 'ghost',
  },
};
