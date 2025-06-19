import type { Meta, StoryObj } from '@storybook/react';
import { SharePreview } from './SharePreview';
import { JournalEntry } from '@/types/journal.types';

const meta: Meta<typeof SharePreview> = {
  title: 'Narraitor/GameSession/Journal/SharePreview',
  component: SharePreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Modal component for previewing and sharing journal stories. Provides formatted text and markdown preview with copy-to-clipboard functionality.',
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
    storyTitle: {
      control: 'text',
      description: 'Title for the exported story'
    },
    entries: {
      description: 'Array of journal entries to preview/share'
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock journal entries for stories
const mockEntries: JournalEntry[] = [
  {
    id: 'entry-1',
    sessionId: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'character_event',
    title: 'Meeting with Elder Thorne',
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
    createdAt: '2023-01-01T10:30:00Z',
    updatedAt: '2023-01-01T10:30:00Z'
  },
  {
    id: 'entry-2',
    sessionId: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'discovery',
    title: 'Hidden Waterfall Passage',
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
    createdAt: '2023-01-01T14:15:00Z',
    updatedAt: '2023-01-01T14:15:00Z'
  },
  {
    id: 'entry-3',
    sessionId: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'achievement',
    title: 'Quest Completed',
    content: 'Successfully completed the first major quest objective by retrieving the Crystal of Ages from the depths of the Forgotten Temple.',
    significance: 'critical',
    isRead: false,
    relatedEntities: [],
    metadata: {
      tags: ['quest', 'achievement', 'crystal', 'temple'],
      automaticEntry: true
    },
    createdAt: '2023-01-02T12:00:00Z',
    updatedAt: '2023-01-02T12:00:00Z'
  }
];

export const Default: Story = {
  args: {
    isOpen: true,
    entries: mockEntries,
    storyTitle: 'The Crystal Quest Adventure',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default share preview modal showing formatted story content with export options.',
      },
    },
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    entries: mockEntries,
    storyTitle: 'My Adventure',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal in closed state - renders nothing when isOpen is false.',
      },
    },
  },
};

export const SingleEntry: Story = {
  args: {
    isOpen: true,
    entries: [mockEntries[0]],
    storyTitle: 'A Brief Encounter',
  },
  parameters: {
    docs: {
      description: {
        story: 'Share preview with only a single journal entry.',
      },
    },
  },
};

export const EmptyStory: Story = {
  args: {
    isOpen: true,
    entries: [],
    storyTitle: 'Empty Adventure',
  },
  parameters: {
    docs: {
      description: {
        story: 'Share preview with no entries - shows empty state formatting.',
      },
    },
  },
};

export const LongStory: Story = {
  args: {
    isOpen: true,
    entries: [
      ...mockEntries,
      {
        id: 'entry-4',
        sessionId: 'session-1',
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'combat',
        title: 'Epic Battle',
        content: 'Engaged in an epic battle against the Shadow\'s minions. The fight was fierce and challenging, testing all skills learned during the journey.',
        significance: 'major',
        isRead: false,
        relatedEntities: [],
        metadata: {
          tags: ['combat', 'shadow', 'epic'],
          automaticEntry: true
        },
        createdAt: '2023-01-03T16:45:00Z',
        updatedAt: '2023-01-03T16:45:00Z'
      },
      {
        id: 'entry-5',
        sessionId: 'session-1',
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'world_event',
        title: 'The Awakening',
        content: 'Witnessed the great awakening as ancient magic stirred throughout the land, changing the very fabric of reality.',
        significance: 'critical',
        isRead: false,
        relatedEntities: [],
        metadata: {
          tags: ['magic', 'awakening', 'world'],
          automaticEntry: true
        },
        createdAt: '2023-01-04T08:00:00Z',
        updatedAt: '2023-01-04T08:00:00Z'
      }
    ],
    storyTitle: 'The Complete Adventure Saga',
  },
  parameters: {
    docs: {
      description: {
        story: 'Share preview with multiple entries showing scrollable content and full story formatting.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    isOpen: true,
    entries: mockEntries,
    storyTitle: 'Interactive Demo',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive version demonstrating copy functionality and format switching. Try clicking the format toggle buttons and copy button.',
      },
    },
  },
};