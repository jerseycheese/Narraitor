import type { Meta, StoryObj } from '@storybook/react';
import SessionControls from './SessionControls';

const meta: Meta<typeof SessionControls> = {
  title: 'Narraitor/Game/SessionControls',
  component: SessionControls,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'paused', 'ended'],
    },
    onPause: { action: 'pause clicked' },
    onResume: { action: 'resume clicked' },
    onEnd: { action: 'end clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    status: 'active',
  },
};
