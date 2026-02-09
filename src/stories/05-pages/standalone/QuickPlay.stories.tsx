import type { Meta, StoryObj } from '@storybook/react';
import { QuickPlay } from '@/components/QuickPlay';
import { createMockStoreState } from '@/components/QuickPlay/QuickPlay.stories.helpers';

const meta: Meta<typeof QuickPlay> = {
  title: '05-Pages/standalone/QuickPlay',
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
      <div>
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
  })],
};
