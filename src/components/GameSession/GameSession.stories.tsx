import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Mock component for isolation in Storybook
const MockGameSession = ({
  status = 'initializing',
  error = null,
  currentSceneId = null,
  playerChoices = [],
  onSelectChoice = () => {},
}: {
  status?: 'initializing' | 'loading' | 'active' | 'paused' | 'ended';
  error?: string | null;
  currentSceneId?: string | null;
  playerChoices?: Array<{ id: string; text: string; isSelected: boolean }>;
  onSelectChoice?: (choiceId: string) => void;
}) => {
  // Loading state
  if (status === 'initializing' || status === 'loading') {
    return (
      <div data-testid="game-session-loading" className="p-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading game session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div data-testid="game-session-error" className="p-4 bg-red-100 text-red-700 rounded">
        <h2 className="text-xl font-bold">Error</h2>
        <p>{error}</p>
        <button 
          data-testid="game-session-error-retry" 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Active session state
  return (
    <div data-testid="game-session-active" className="p-4">
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-2">Current Scene</h2>
        <p>This is the narrative text for the current scene (ID: {currentSceneId || 'none'}).</p>
        <p className="italic text-gray-600 mt-2">You are in a dimly lit tavern. The air is thick with smoke and the scent of ale. A mysterious figure sits in the corner, watching you.</p>
      </div>

      {playerChoices.length > 0 && (
        <div data-testid="player-choices" className="mt-4">
          <h3 className="text-lg font-semibold mb-2">What will you do?</h3>
          <div className="space-y-2">
            {playerChoices.map(choice => (
              <button
                key={choice.id}
                data-testid={`player-choice-${choice.id}`}
                className={`block w-full text-left p-3 border rounded ${
                  choice.isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white'
                }`}
                onClick={() => onSelectChoice(choice.id)}
              >
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button 
          data-testid="game-session-controls-pause" 
          className="px-4 py-2 bg-yellow-600 text-white rounded"
        >
          Pause
        </button>
        <button 
          data-testid="game-session-controls-end" 
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          End Session
        </button>
      </div>
    </div>
  );
};

// Sample player choices
const sampleChoices = [
  { id: 'choice-1', text: 'Approach the mysterious figure', isSelected: false },
  { id: 'choice-2', text: 'Order another drink from the bartender', isSelected: false },
  { id: 'choice-3', text: 'Leave the tavern', isSelected: false },
];

const meta: Meta<typeof MockGameSession> = {
  title: 'Narraitor/Game/Session/GameSession',
  component: MockGameSession,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Game session component that displays the current narrative and player choices'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['initializing', 'loading', 'active', 'paused', 'ended'],
    },
    onSelectChoice: { action: 'choice selected' },
  },
};

export default meta;
type Story = StoryObj<typeof MockGameSession>;

// Loading state story
export const Loading: Story = {
  args: {
    status: 'loading',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state while game session initializes'
      }
    }
  },
};

// Error state story
export const Error: Story = {
  args: {
    status: 'initializing',
    error: 'World not found or failed to load game session',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state when game session fails to initialize'
      }
    }
  },
  render: (args) => (
    <div className="p-4 bg-red-100 text-red-700 rounded">
      <h2 className="text-xl font-bold">Error</h2>
      <p>{args.error}</p>
      <div className="mt-4 flex space-x-2">
        <button 
          data-testid="game-session-error-retry" 
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Retry
        </button>
        <button 
          data-testid="game-session-error-dismiss" 
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Return to Home
        </button>
      </div>
    </div>
  )
};

// Active session story
export const ActiveSession: Story = {
  args: {
    status: 'active',
    currentSceneId: 'tavern-scene-1',
    playerChoices: sampleChoices,
  },
  parameters: {
    docs: {
      description: {
        story: 'Active game session with narrative and player choices'
      }
    }
  },
};

// No choices state
export const NoChoicesAvailable: Story = {
  args: {
    status: 'active',
    currentSceneId: 'tavern-scene-1',
    playerChoices: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Active game session with no player choices available'
      }
    }
  },
};