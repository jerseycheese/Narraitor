import type { Meta, StoryObj } from '@storybook/react';
import GameSessionTestHarness from './GameSessionTestHarness';

const meta: Meta<typeof GameSessionTestHarness> = {
  title: 'Narraitor/Game/GameSession/TestHarness',
  component: GameSessionTestHarness,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive test harness for GameSession component that allows testing all states and transitions'
      }
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GameSessionTestHarness>;

export const DefaultTestHarness: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Interactive test harness for GameSession component'
      }
    }
  },
};
