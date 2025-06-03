import type { Meta, StoryObj } from '@storybook/react';
import { QuickPlay } from './QuickPlay';
import { createMockStoreState } from './QuickPlay.stories.helpers';

const meta: Meta<typeof QuickPlay> = {
  title: 'Narraitor/Game/Start/QuickPlay',
  component: QuickPlay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Quick Play component that allows users to continue their last game or start a new adventure.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-8 bg-gray-50">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSavedSessions: Story = {
  name: 'No Saved Sessions',
  decorators: [createMockStoreState({ hasSession: false })],
};

export const WithSavedSession: Story = {
  name: 'With Saved Session',
  decorators: [createMockStoreState({ 
    hasSession: true,
    narrativeCount: 12,
    timeAgo: 3600000, // 1 hour ago
  })],
};