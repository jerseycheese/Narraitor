import type { Meta, StoryObj } from '@storybook/react';
import SessionControls from './SessionControls';

const meta: Meta<typeof SessionControls> = {
  title: 'Narraitor/GameSession/SessionControls',
  component: SessionControls,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onEnd: { action: 'end clicked' },
    onRestart: { action: 'restart clicked' },
    onEndStory: { action: 'end story clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveSession: Story = {
  args: {
    onRestart: undefined,
    onEndStory: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic session controls with only the End Session button.',
      },
    },
  },
};

export const WithAllControls: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Session controls with all optional buttons: New Session, End Story, and End Session.',
      },
    },
  },
};

