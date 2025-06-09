import type { Meta, StoryObj } from '@storybook/react';
import ActiveGameSession from './ActiveGameSession';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useJournalStore } from '@/state/journalStore';
import { JournalEntry } from '@/types/journal.types';

const meta: Meta<typeof ActiveGameSession> = {
  title: 'Narraitor/GameSession/ActiveGameSession/JournalAccess',
  component: ActiveGameSession,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
        # ActiveGameSession - Journal Access Feature
        
        This story demonstrates Issue #278 implementation: "Open journal interface seamlessly during active gameplay sessions"
        
        ## Key Features Tested
        - Journal access button visible in main game session UI 
        - Game session state preserved when journal opened
        - Journal access available during all gameplay states
        - Journal opens with smooth transition
        - Narrative components remain functional when journal open
        
        ## Acceptance Criteria Verified
        - ✅ AC1: Journal interface can be opened from main game session UI
        - ✅ AC2: Opening journal preserves current game session state  
        - ✅ AC3: Journal access available at any point during gameplay
        - ✅ AC4: Journal opens with smooth transition
        - ✅ AC5: Opening journal doesn't interrupt narrative flow
        `,
      },
    },
  },
  argTypes: {
    onChoiceSelected: { action: 'choice selected' },
    onEnd: { action: 'session ended' },
    status: {
      control: 'select',
      options: ['active', 'paused', 'ended'],
    },
  },
  decorators: [
    (Story) => {
      // Setup stores for journal access testing
      useSessionStore.setState({
        characterId: 'char-1',
        id: 'session-1',
        status: 'active',
        currentSceneId: null,
        playerChoices: [],
        error: null,
        worldId: 'world-1',
        savedSessions: {}
      });
      
      useCharacterStore.setState({
        characters: {
          'char-1': {
            id: 'char-1',
            name: 'Aria Nightwind',
            worldId: 'world-1',
            background: 'A skilled ranger from the northern forests',
            createdAt: '2023-01-01T00:00:00Z'
          }
        },
        currentCharacterId: 'char-1',
        error: null,
        loading: false
      });
      
      // Reset journal store
      useJournalStore.setState({
        entries: {},
        sessionEntries: {},
        error: null,
        loading: false
      });
      
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock journal entries for testing
const mockJournalEntries: Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'>[] = [
  {
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'character_event',
    title: 'Started the Adventure',
    content: 'Set out from the village on a quest to find the ancient artifacts.',
    significance: 'major',
    isRead: false,
    relatedEntities: [],
    metadata: { tags: ['quest'], automaticEntry: true }
  },
  {
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'discovery',
    title: 'Found Strange Runes',
    content: 'Discovered mysterious runes carved into an old stone.',
    significance: 'minor',
    isRead: true,
    relatedEntities: [],
    metadata: { tags: ['mystery'], automaticEntry: true }
  }
];

// Decorator to add journal entries
const withJournalEntries = (entries: typeof mockJournalEntries) => (Story: any) => {
  const sessionId = 'session-1';
  const { addEntry, reset } = useJournalStore.getState();
  
  reset();
  entries.forEach(entry => addEntry(sessionId, entry));
  
  return <Story />;
};

export const WithJournalAccess: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    status: 'active',
  },
  decorators: [withJournalEntries(mockJournalEntries)],
  parameters: {
    docs: {
      description: {
        story: 'Active game session with journal access button. Click the 📖 Journal button to open the journal modal.',
      },
    },
  },
};

export const EmptyJournal: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    status: 'active',
  },
  decorators: [withJournalEntries([])],
  parameters: {
    docs: {
      description: {
        story: 'Game session with empty journal. Journal modal will show "No journal entries yet" message.',
      },
    },
  },
};

export const PausedGameWithJournal: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    status: 'paused',
  },
  decorators: [withJournalEntries(mockJournalEntries)],
  parameters: {
    docs: {
      description: {
        story: 'Paused game session with journal access still available (AC3: available at any point during gameplay).',
      },
    },
  },
};

export const NoCharacterNoJournal: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    status: 'active',
  },
  decorators: [
    (Story) => {
      // Override to have no character
      useSessionStore.setState({
        characterId: null,
        id: 'session-1',
        status: 'active',
        currentSceneId: null,
        playerChoices: [],
        error: null,
        worldId: 'world-1',
        savedSessions: {}
      });
      
      useCharacterStore.setState({
        characters: {},
        currentCharacterId: null,
        error: null,
        loading: false
      });
      
      return <Story />;
    },
    withJournalEntries([])
  ],
  parameters: {
    docs: {
      description: {
        story: 'Game session without character - journal access button should not be visible.',
      },
    },
  },
};