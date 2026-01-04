import type { Meta, StoryObj } from '@storybook/react';
import { JournalPage } from '@/components/Journal/JournalPage';
import { useJournalStore } from '@/state/journalStore';
import { useSessionStore } from '@/state/sessionStore';
import { JournalEntry } from '@/types/journal.types';
import { mockEntries, journalCharacterId, journalSessionId, journalWorldId } from './journalStoryData';

const meta: Meta<typeof JournalPage> = {
  title: '03-Organisms/journal/JournalPage',
  component: JournalPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Dedicated journal page with list-detail layout and responsive behavior.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const withJournalState = (entries: JournalEntry[]) => (StoryComponent: React.ComponentType) => {
  const { reset, addEntry, updateEntry } = useJournalStore.getState();
  reset();

  entries.forEach((entry) => {
    const { id: _id, sessionId, createdAt, updatedAt, ...entryData } = entry;
    const newId = addEntry(sessionId, entryData);
    updateEntry(newId, {
      isRead: entry.isRead,
      createdAt,
      updatedAt,
    });
  });

  useSessionStore.setState({
    id: journalSessionId,
    characterId: journalCharacterId,
    worldId: journalWorldId,
    status: 'active',
    currentSceneId: null,
    playerChoices: [],
    error: null,
    savedSessions: {},
  });

  return <StoryComponent />;
};

export const Default: Story = {
  args: {
    worldId: journalWorldId,
  },
  decorators: [withJournalState(mockEntries)],
};

export const EmptyJournal: Story = {
  args: {
    worldId: journalWorldId,
  },
  decorators: [withJournalState([])],
};
