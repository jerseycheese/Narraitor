import type { Meta, StoryObj } from '@storybook/react';
import { JournalEntryList } from '@/components/Journal/JournalEntryList';
import { mockEntries } from './journalStoryData';

const meta: Meta<typeof JournalEntryList> = {
  title: '03-Organisms/journal/JournalEntryList',
  component: JournalEntryList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'List view of journal entries with unread indicators and system event styling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onEntrySelect: { action: 'entry-selected' },
  },
  decorators: [
    (Story) => (
      <div className="w-80 h-[480px] bg-white border border-amber-500 rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entries: mockEntries,
    selectedEntryId: mockEntries[1].id,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
    selectedEntryId: null,
  },
};
