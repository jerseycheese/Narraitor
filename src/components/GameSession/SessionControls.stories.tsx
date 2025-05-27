import type { Meta, StoryObj } from '@storybook/react';
import SessionControls from './SessionControls';

const meta: Meta<typeof SessionControls> = {
  title: 'Narraitor/GameSession/SessionControls',
  component: SessionControls,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onPause: { action: 'pause clicked' },
    onResume: { action: 'resume clicked' },
    onEnd: { action: 'end clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveSession: Story = {
  args: {
    status: 'active',
  },
};

export const PausedSession: Story = {
  args: {
    status: 'paused',
  },
};

export const EndedSession: Story = {
  args: {
    status: 'ended',
  },
};