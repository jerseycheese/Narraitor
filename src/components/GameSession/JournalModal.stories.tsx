import type { Meta, StoryObj } from '@storybook/react';
import { JournalModal } from './JournalModal';
import { useJournalStore } from '@/state/journalStore';
import { JournalEntry } from '@/types/journal.types';

const meta: Meta<typeof JournalModal> = {
  title: 'Narraitor/GameSession/JournalModal',
  component: JournalModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Modal component for displaying journal entries during active gameplay sessions. Preserves game state and provides smooth access to journal content.',
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
    },
    worldId: {
      control: 'text', 
      description: 'Current world ID'
    },
    characterId: {
      control: 'text',
      description: 'Current character ID'
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
    title: 'Met the Village Elder',
    content: 'Had a meaningful conversation with Elder Thorne about the ancient prophecy. He mentioned that the old temple holds secrets about the missing artifacts.',
    significance: 'major',
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
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'discovery',
    title: 'Found Hidden Passage',
    content: 'Discovered a concealed entrance behind the waterfall. The passage seems to lead deeper into the mountain.',
    significance: 'minor',
    isRead: true,
    relatedEntities: [
      { type: 'location', id: 'waterfall', name: 'Crystal Waterfall' },
      { type: 'location', id: 'passage', name: 'Hidden Passage' }
    ],
    metadata: {
      tags: ['exploration', 'secret'],
      automaticEntry: true,
      narrativeSegmentId: 'segment-2'
    },
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'combat',
    title: 'Bandit Encounter',
    content: 'Fought off a group of bandits on the mountain path. Managed to defeat them without serious injury, but they mentioned working for someone called "The Shadow".',
    significance: 'minor',
    isRead: false,
    relatedEntities: [
      { type: 'character', id: 'shadow', name: 'The Shadow' },
      { type: 'event', id: 'bandit-fight', name: 'Bandit Ambush' }
    ],
    metadata: {
      tags: ['combat', 'bandits', 'shadow'],
      automaticEntry: true,
      narrativeSegmentId: 'segment-3'
    },
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'relationship_change',
    title: 'Gained Trust of Merchant',
    content: 'Helped Maya the merchant recover her stolen goods. She now offers better prices and valuable information about the local area.',
    significance: 'minor',
    isRead: true,
    relatedEntities: [
      { type: 'character', id: 'maya', name: 'Maya the Merchant' }
    ],
    metadata: {
      tags: ['merchant', 'trust', 'trade'],
      automaticEntry: true,
      narrativeSegmentId: 'segment-4'
    },
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

// Story decorator to populate journal store with mock data
const withMockJournal = (entries: typeof mockEntries) => {
  const MockJournalDecorator = (Story: React.ComponentType) => {
    const sessionId = 'session-1';
    
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
    sessionId: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1'
  },
  decorators: [withMockJournal(mockEntries)],
};

export const EmptyJournal: Story = {
  args: {
    isOpen: true,
    sessionId: 'empty-session',
    worldId: 'world-1',
    characterId: 'char-1'
  },
  decorators: [withMockJournal([])],
};

export const SingleEntry: Story = {
  args: {
    isOpen: true,
    sessionId: 'session-single',
    worldId: 'world-1',
    characterId: 'char-1'
  },
  decorators: [withMockJournal([mockEntries[0]])],
};

export const ManyEntries: Story = {
  args: {
    isOpen: true,
    sessionId: 'session-many',
    worldId: 'world-1',
    characterId: 'char-1'
  },
  decorators: [withMockJournal([
    ...mockEntries,
    ...mockEntries.map((entry, i) => ({
      ...entry,
      title: `${entry.title} (Copy ${i + 1})`,
      content: `${entry.content} This is an additional entry to test scrolling behavior.`
    }))
  ])],
};

export const Closed: Story = {
  args: {
    isOpen: false,
    sessionId: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1'
  },
  decorators: [withMockJournal(mockEntries)],
};