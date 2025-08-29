import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { JournalModal } from './JournalModal';
import { JournalEntry } from '@/types/journal.types';

// Mock the journal store for Storybook
const mockJournalStore = {
  addEntry: () => 'mock-id',
  updateEntry: () => {},
  deleteEntry: () => {},
  markAsRead: () => {},
  deleteSessionEntries: () => {},
  getEntriesByType: () => [],
  reset: () => {},
  setError: () => {},
  clearError: () => {},
  setLoading: () => {},
  entries: {},
  sessionEntries: {},
  error: null,
  loading: false
};

// Mock session boundary entries for different scenarios
const sessionStartEntry: JournalEntry = {
  id: 'session-start-1',
  sessionId: 'story-session',
  worldId: 'fantasy-realm',
  characterId: 'brave-hero',
  type: 'session_start',
  title: 'Adventure Begins',
  content: 'A new chapter in your story starts as you enter the mystical Kingdom of Eldara. The morning sun casts long shadows across the cobblestone path ahead.',
  significance: 'minor',
  isRead: false,
  relatedEntities: [],
  metadata: {
    tags: ['system', 'session', 'adventure-start'],
    automaticEntry: true,
    sessionStartTime: '2024-01-15T10:30:00Z',
    sessionContext: {
      worldName: 'Kingdom of Eldara',
      characterName: 'Lyra the Bold',
      sessionNumber: 1
    }
  },
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z'
};

const sessionEndEntry: JournalEntry = {
  id: 'session-end-1',
  sessionId: 'story-session',
  worldId: 'fantasy-realm',
  characterId: 'brave-hero',
  type: 'session_end',
  title: 'Chapter Closes',
  content: 'Your adventure in the Kingdom of Eldara comes to a pause after 45 minutes of exploration. You made 8 meaningful decisions and experienced 12 narrative moments that shaped your story.',
  significance: 'minor',
  isRead: false,
  relatedEntities: [],
  metadata: {
    tags: ['system', 'session', 'chapter-end'],
    automaticEntry: true,
    sessionStartTime: '2024-01-15T10:30:00Z',
    sessionDuration: 2700000 // 45 minutes in milliseconds
  },
  createdAt: '2024-01-15T11:15:00Z',
  updatedAt: '2024-01-15T11:15:00Z'
};

const narrativeEntry: JournalEntry = {
  id: 'narrative-discovery-1',
  sessionId: 'story-session',
  worldId: 'fantasy-realm',
  characterId: 'brave-hero',
  type: 'discovery',
  title: 'Ancient Runes Discovered',
  content: 'Beneath the gnarled roots of the Elderoak, you discovered weathered stone tablets covered in mysterious runes. The symbols seem to pulse with an inner light when touched.',
  detailedContent: 'Beneath the gnarled roots of the ancient Elderoak tree, partially hidden by centuries of accumulated earth and moss, you discovered a collection of weathered stone tablets. Each tablet is covered in mysterious runes that seem to shift and shimmer in the dappled sunlight filtering through the canopy above.\n\nAs your fingers trace the carved symbols, they begin to pulse with a soft, ethereal light - first blue, then silver, then a warm golden hue. The runes appear to be some form of ancient script, possibly predating the current kingdom by millennia.\n\nThe discovery fills you with both excitement and trepidation. These could be the key to understanding the old magic that once flowed through this realm.',
  significance: 'major',
  isRead: true,
  relatedEntities: [
    { type: 'location', id: 'elderoak-grove', name: 'Elderoak Grove' },
    { type: 'item', id: 'runic-tablets', name: 'Ancient Runic Tablets' }
  ],
  metadata: {
    tags: ['discovery', 'ancient-magic', 'runes', 'elderoak'],
    automaticEntry: false
  },
  createdAt: '2024-01-15T10:45:00Z',
  updatedAt: '2024-01-15T10:45:00Z'
};

const combatEntry: JournalEntry = {
  id: 'combat-encounter-1',
  sessionId: 'story-session',
  worldId: 'fantasy-realm',
  characterId: 'brave-hero',
  type: 'combat',
  title: 'Shadow Wolf Encounter',
  content: 'A fierce battle with a shadow wolf near the crystal caves. Victory achieved through cunning rather than brute force.',
  significance: 'major',
  isRead: true,
  relatedEntities: [
    { type: 'character', id: 'shadow-wolf', name: 'Shadow Wolf' },
    { type: 'location', id: 'crystal-caves', name: 'Crystal Caves' }
  ],
  metadata: {
    tags: ['combat', 'shadow-creatures', 'tactical-victory'],
    automaticEntry: false
  },
  createdAt: '2024-01-15T11:00:00Z',
  updatedAt: '2024-01-15T11:00:00Z'
};

const meta: Meta<typeof JournalModal> = {
  title: 'GameSession/JournalModal/Session Boundary Logging',
  component: JournalModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### Session Boundary Logging Feature (Issue #176)

This story demonstrates how session boundary events (session start/end) are displayed in the Journal Modal with:

- **System Event Indicators**: Session boundary entries are marked with 'system' tags and automaticEntry: true
- **Distinct Visual Formatting**: Session events have different styling from narrative events
- **Duration Metadata**: Session end entries include duration and statistics
- **Chronological Organization**: Events display in reverse chronological order (newest first)
- **Accessibility**: Proper ARIA labels and semantic markup for screen readers

**Key Features:**
- Session start entries capture the beginning of gameplay with context metadata
- Session end entries include duration, decision count, and other session statistics
- System events are visually distinct from user narrative events
- All entries maintain consistent journal entry structure and formatting
        `
      }
    }
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the journal modal is open'
    },
    sessionId: {
      control: 'text',
      description: 'ID of the current session'
    }
  }
};

export default meta;
type Story = StoryObj<typeof JournalModal>;

// Mock useJournalStore for Storybook
const createMockStore = (entries: JournalEntry[]) => ({
  ...mockJournalStore,
  getSessionEntries: () => entries.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
});

export const SessionStartOnly: Story = {
  args: {
    isOpen: true,
    sessionId: 'story-session'
  },
  decorators: [
    (Story) => {
      // Mock the store with only session start entry
      jest.doMock('@/state/journalStore', () => ({
        useJournalStore: () => createMockStore([sessionStartEntry])
      }));
      
      return <Story />;
    }
  ],
  parameters: {
    docs: {
      description: {
        story: `
**Session Start Entry Display**

Shows how a session start entry appears in the journal:
- Marked with "Session Start" type badge
- Contains session context metadata
- System tags indicate automatic creation
- Minor significance (system events are typically minor)
        `
      }
    }
  }
};

export const SessionEndOnly: Story = {
  args: {
    isOpen: true,
    sessionId: 'story-session'
  },
  decorators: [
    (Story) => {
      jest.doMock('@/state/journalStore', () => ({
        useJournalStore: () => createMockStore([sessionEndEntry])
      }));
      
      return <Story />;
    }
  ],
  parameters: {
    docs: {
      description: {
        story: `
**Session End Entry Display**

Shows how a session end entry appears with rich metadata:
- Includes session duration (45 minutes)
- Contains session statistics (decisions, segments, etc.)
- Shows start and end times in metadata
- Automatically generated system entry
        `
      }
    }
  }
};

export const CompleteSessionWithNarrative: Story = {
  args: {
    isOpen: true,
    sessionId: 'story-session'
  },
  decorators: [
    (Story) => {
      jest.doMock('@/state/journalStore', () => ({
        useJournalStore: () => createMockStore([
          sessionEndEntry,
          combatEntry,
          narrativeEntry,
          sessionStartEntry
        ])
      }));
      
      return <Story />;
    }
  ],
  parameters: {
    docs: {
      description: {
        story: `
**Complete Session Journal**

Shows a complete session with:
- Session start and end boundary entries
- Mixed narrative events (discovery, combat)
- Proper chronological ordering (newest first)
- Visual distinction between system and narrative events

**Event Types:**
- **Session End** (system): Chapter Closes - with duration and stats
- **Combat** (narrative): Shadow Wolf Encounter - player action
- **Discovery** (narrative): Ancient Runes - world exploration  
- **Session Start** (system): Adventure Begins - session initiation
        `
      }
    }
  }
};

export const MultipleSessionBoundaries: Story = {
  args: {
    isOpen: true,
    sessionId: 'story-session'
  },
  decorators: [
    (Story) => {
      const multipleSessions: JournalEntry[] = [
        {
          ...sessionEndEntry,
          id: 'session-end-2',
          title: 'Second Chapter Ends',
          content: 'Another session concludes after 30 minutes of intense gameplay.',
          createdAt: '2024-01-16T15:45:00Z'
        },
        {
          ...sessionStartEntry,
          id: 'session-start-2', 
          title: 'Chapter Two Begins',
          content: 'Continuing your adventure in the Kingdom of Eldara.',
          createdAt: '2024-01-16T15:15:00Z'
        },
        sessionEndEntry,
        sessionStartEntry
      ];
      
      jest.doMock('@/state/journalStore', () => ({
        useJournalStore: () => createMockStore(multipleSessions)
      }));
      
      return <Story />;
    }
  ],
  parameters: {
    docs: {
      description: {
        story: `
**Multiple Session Boundaries**

Demonstrates how multiple session start/end entries appear:
- Each session has clear start and end markers
- Entries maintain chronological order across sessions
- System consistency across all boundary events
- Easy to track session patterns and duration trends
        `
      }
    }
  }
};

export const SessionBoundaryAccessibility: Story = {
  args: {
    isOpen: true,
    sessionId: 'story-session'
  },
  decorators: [
    (Story) => {
      jest.doMock('@/state/journalStore', () => ({
        useJournalStore: () => createMockStore([sessionStartEntry, sessionEndEntry])
      }));
      
      return <Story />;
    }
  ],
  parameters: {
    docs: {
      description: {
        story: `
**Accessibility Features**

Session boundary entries include:
- Proper ARIA labels for modal dialog
- Semantic markup for entry types
- Screen reader friendly content descriptions
- Keyboard navigation support
- High contrast visual indicators

Test with screen readers to verify accessibility compliance.
        `
      }
    }
  }
};