import type { Meta, StoryObj } from '@storybook/react';
import { JournalPage } from '@/components/Journal/JournalPage';
import { useJournalStore } from '@/state/journalStore';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldStore } from '@/state/worldStore';
import { JournalEntry } from '@/types/journal.types';
import { World } from '@/types/world.types';
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

const mockWorld: World = {
  id: journalWorldId,
  name: 'Storybook Realm',
  description: 'A world for journal page stories.',
  genre: 'fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 12,
    skillPointPool: 10,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const withJournalState = (entries: JournalEntry[]) => {
  const JournalPageDecorator = (StoryComponent: React.ComponentType) => {
    useWorldStore.setState({
      worlds: { [journalWorldId]: mockWorld },
      entities: { [journalWorldId]: mockWorld },
    });

    const { reset, addEntry, updateEntry } = useJournalStore.getState();
    reset();

    entries.forEach((entry) => {
      const { id, sessionId, createdAt, ...entryData } = entry;
      void id;
      const newId = addEntry(sessionId, entryData);
      updateEntry(newId, {
        isRead: entry.isRead,
        createdAt,
        updatedAt: entry.updatedAt,
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

  JournalPageDecorator.displayName = 'JournalPageDecorator';

  return JournalPageDecorator;
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
