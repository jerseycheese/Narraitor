import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState } from '@/components/ui/LoadingState/LoadingState';

const meta: Meta<typeof LoadingState> = {
  title: '01-Atoms/feedback/LoadingState',
  component: LoadingState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Loading indicator with four variants: spinner, pulse, dots, skeleton.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['spinner', 'pulse', 'dots', 'skeleton'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    message: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Spinner: Story = {
  args: {
    variant: 'spinner',
    message: 'Loading...',
  },
};

export const Pulse: Story = {
  args: {
    variant: 'pulse',
    message: 'Loading your worlds...',
  },
};

export const PulseWithAvatar: Story = {
  args: {
    variant: 'pulse',
    showAvatar: true,
    message: 'Loading profile...',
  },
};

export const Dots: Story = {
  args: {
    variant: 'dots',
    message: 'Writing your story...',
  },
};

export const Skeleton: Story = {
  args: {
    variant: 'skeleton',
    skeletonLines: 4,
  },
};
