import type { Meta, StoryObj } from '@storybook/react';
import { JournalEntryDetail } from '@/components/Journal/JournalEntryDetail';
import { mockEntries } from './journalStoryData';

const meta: Meta<typeof JournalEntryDetail> = {
  title: '03-Organisms/journal/JournalEntryDetail',
  component: JournalEntryDetail,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays the full content of a journal entry with metadata, related entities, and tags.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showBackButton: {
      control: 'boolean',
      description: 'Show a back button for mobile navigation',
    },
    onBack: { action: 'back' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DiscoveryEntry: Story = {
  args: {
    entry: mockEntries[1],
  },
};

export const DecisionEntry: Story = {
  args: {
    entry: mockEntries[2],
  },
};

export const SessionEndEntry: Story = {
  args: {
    entry: mockEntries[3],
    showBackButton: true,
    onBack: () => {},
  },
};
