import type { Meta, StoryObj } from '@storybook/react';
import { JournalModal } from '@/components/GameSession/JournalModal';
import { useJournalStore } from '@/state/journalStore';
import { JournalEntry } from '@/types/journal.types';

const meta: Meta<typeof JournalModal> = {
  title: '03-Organisms/journal/JournalModal',
  component: JournalModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Enhanced journal modal with book-like interface for MVP. Provides an elegant reading experience for completed story sessions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open'
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal is closed'
    },
    sessionId: {
      control: 'text',
      description: 'Current game session ID'
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock journal entries for stories
const mockEntries: Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'>[] = [
  {
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'character_event',
    title: '03-Organisms/journal/JournalModal',
    content: 'Had a meaningful conversation with Elder Thorne about the ancient prophecy and missing artifacts. He spoke of dark times ahead and the need for chosen heroes.',
    significance: 'critical',
    isRead: false,
    relatedEntities: [
      { type: 'character', id: 'elder-thorne', name: 'Elder Thorne' },
      { type: 'location', id: 'temple', name: 'Ancient Temple' }
    ],
    metadata: {
      tags: ['prophecy', 'elder', 'temple'],
      automaticEntry: true,
      narrativeSegmentId: 'segment-1'
    },
    updatedAt: '2023-01-01T10:30:00Z'
  },
  {
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'discovery',
    title: '03-Organisms/journal/JournalModal',
    content: 'Discovered a concealed entrance behind the waterfall leading into the mountain. The passage seems ancient and untouched by time.',
    significance: 'major',
    isRead: false,
    relatedEntities: [
      { type: 'location', id: 'waterfall', name: 'Crystal Waterfall' },
      { type: 'location', id: 'passage', name: 'Hidden Passage' }
    ],
    metadata: {
      tags: ['exploration', 'secret', 'mountain'],
      automaticEntry: true,
      narrativeSegmentId: 'segment-2'
    },
    updatedAt: '2023-01-01T14:15:00Z'
  },
  {
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'combat',
    title: '03-Organisms/journal/JournalModal',
    content: 'Defeated bandits who mentioned working for someone called "The Shadow". They carried strange coins with unknown markings.',
    significance: 'minor',
    isRead: false,
    relatedEntities: [
      { type: 'character', id: 'shadow', name: 'The Shadow' },
      { type: 'event', id: 'bandit-fight', name: 'Bandit Ambush' }
    ],
    metadata: {
      tags: ['combat', 'bandits', 'shadow', 'mystery'],
      automaticEntry: true,
      narrativeSegmentId: 'segment-3'
    },
    updatedAt: '2023-01-02T09:45:00Z'
  },
  {
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'relationship_change',
    title: '03-Organisms/journal/JournalModal',
    content: 'Helped Maya the merchant recover stolen goods and gained her trust. She offered valuable information about trade routes and safe havens.',
    significance: 'minor',
    isRead: false,
    relatedEntities: [
      { type: 'character', id: 'maya', name: 'Maya the Merchant' }
    ],
    metadata: {
      tags: ['merchant', 'trust', 'trade', 'information'],
      automaticEntry: true,
      narrativeSegmentId: 'segment-4'
    },
    updatedAt: '2023-01-02T16:20:00Z'
  }
];

// Story decorator to populate journal store with mock data
const withMockJournal = (entries: typeof mockEntries, sessionId: string = 'session-1') => {
  const MockJournalDecorator = (Story: React.ComponentType) => {
    // Clear and populate journal store
    const { addEntry, reset } = useJournalStore.getState();
    reset();
    
    entries.forEach(entry => {
      addEntry(sessionId, entry);
    });

    return <Story />;
  };
  
  return MockJournalDecorator;
};

export const Default: Story = {
  args: {
    isOpen: true,
    sessionId: 'session-1'
  },
  decorators: [withMockJournal(mockEntries)],
};

export const EmptyJournal: Story = {
  args: {
    isOpen: true,
    sessionId: 'empty-session'
  },
  decorators: [withMockJournal([])],
};

export const SingleEntry: Story = {
  args: {
    isOpen: true,
    sessionId: 'session-single'
  },
  decorators: [withMockJournal([mockEntries[0]], 'session-single')],
};

export const ManyEntries: Story = {
  args: {
    isOpen: true,
    sessionId: 'session-many'
  },
  decorators: [withMockJournal([
    ...mockEntries,
    {
      worldId: 'world-1',
      characterId: 'char-1',
      type: 'achievement',
      title: '03-Organisms/journal/JournalModal',
      content: 'Completed the first major quest objective by retrieving the Crystal of Ages from the depths of the Forgotten Temple.',
      significance: 'critical',
      isRead: false,
      relatedEntities: [],
      metadata: { tags: ['quest', 'achievement', 'crystal', 'temple'], automaticEntry: true },
      updatedAt: '2023-01-03T12:00:00Z'
    },
    {
      worldId: 'world-1',
      characterId: 'char-1',
      type: 'world_event',
      title: '03-Organisms/journal/JournalModal',
      content: 'The ancient magic began to stir throughout the land, causing strange phenomena and awakening long-dormant creatures.',
      significance: 'major',
      isRead: false,
      relatedEntities: [],
      metadata: { tags: ['magic', 'world', 'awakening'], automaticEntry: true },
      updatedAt: '2023-01-03T18:30:00Z'
    }
  ], 'session-many')],
};


