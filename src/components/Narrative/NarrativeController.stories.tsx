import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeController } from './NarrativeController';
import { NarrativeHistory } from './NarrativeHistory';
import { NarrativeSegment } from '@/types/narrative.types';

const meta = {
  title: 'Narraitor/Narrative/Control/NarrativeController',
  component: NarrativeController,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
        # NarrativeController
        
        The NarrativeController manages the generation, storage, and display of narrative content.
        
        ## Features
        
        - Automatically generates initial narrative on mount
        - Maintains history of narrative segments
        - Handles player choices to generate new narrative segments
        - Displays loading and error states
        
        ## Usage
        
        \`\`\`jsx
        <NarrativeController
          worldId="world-123"
          sessionId="session-456"
          triggerGeneration={true}
          choiceId="choice-123"
          onNarrativeGenerated={(segment) => console.log('New segment:', segment)}
        />
        \`\`\`
        `,
      },
    },
  },
  argTypes: {
    worldId: { control: 'text' },
    sessionId: { control: 'text' },
    triggerGeneration: { control: 'boolean' },
    choiceId: { control: 'text' },
    onNarrativeGenerated: { action: 'onNarrativeGenerated' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof NarrativeController>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic narrative controller demonstration
function DefaultNarrativeControllerStory() {
  const [segments, setSegments] = React.useState<NarrativeSegment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true); // Start with loading
  
  React.useEffect(() => {
    // Simulate loading and generation
    const timer = setTimeout(() => {
      const newSegment: NarrativeSegment = {
        id: 'seg-1',
        content: 'Once upon a time, in a land far, far away, there lived a brave adventurer. The world was filled with magic and wonder, and each day brought new discoveries.',
        type: 'scene',
        sessionId: 'session-1',
        worldId: 'world-1',
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['opening', 'introduction'],
          mood: 'mysterious'
        }
      };
      
      setSegments([newSegment]);
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">NarrativeController Demo</h2>
      <div className="p-4 bg-white rounded-lg shadow-md">
        <NarrativeHistory 
          segments={segments}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export const Default: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
  },
  render: DefaultNarrativeControllerStory
};

// Narrative with multiple segments
function WithExistingSegmentsStory() {
  const mockSegments: NarrativeSegment[] = [
    {
      id: 'seg-1',
      content: 'The morning sun filtered through the trees, casting dappled shadows on the forest floor.',
      type: 'scene',
      sessionId: 'session-multi',
      worldId: 'world-1',
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        tags: ['opening', 'introduction'],
        mood: 'mysterious'
      }
    },
    {
      id: 'seg-2',
      content: 'You found a mysterious artifact half-buried in the dirt. It glowed with an inner light.',
      type: 'action', // Changed from 'exploration' to match valid types
      sessionId: 'session-multi',
      worldId: 'world-1',
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        tags: ['discovery', 'artifact'],
        mood: 'mysterious'
      }
    },
    {
      id: 'seg-3',
      content: 'As you touched the artifact, a surge of energy coursed through your veins.',
      type: 'action',
      sessionId: 'session-multi',
      worldId: 'world-1',
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        tags: ['action', 'magic'],
        mood: 'tense'
      }
    },
  ];
  
  return <NarrativeHistory segments={mockSegments} isLoading={false} />;
}

export const WithExistingSegments: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-multi',
    triggerGeneration: false
  },
  render: WithExistingSegmentsStory
};

// Generating next segment from choice
function GeneratingFromChoiceStory() {
  const [segments, setSegments] = React.useState<NarrativeSegment[]>([
    {
      id: 'seg-1',
      content: 'You face a fork in the road.',
      type: 'scene', // Changed from 'decision' to match valid types
      sessionId: 'session-choice',
      worldId: 'world-1',
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        tags: ['choice', 'decision'],
        mood: 'neutral'
      }
    }
  ]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentChoice, setCurrentChoice] = React.useState<string | null>(null);
  
  const handleChoiceClick = (choice: string) => {
    setCurrentChoice(choice);
    setIsLoading(true);
    
    // Simulate choice-based generation
    setTimeout(() => {
      const newContent = choice === 'left'
        ? 'You take the left path, which winds through a dense thicket. The air grows cooler.'
        : 'You choose the right path, which ascends a gentle slope. The sun shines brighter here.';
      
      const newSegment: NarrativeSegment = {
        id: `seg-${segments.length + 1}`,
        content: newContent,
        type: 'action', // Changed from 'exploration' to match valid types
        sessionId: 'session-choice',
        worldId: 'world-1',
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['choice', 'path'],
          mood: 'neutral'
        }
      };
      
      setSegments(prev => [...prev, newSegment]);
      setIsLoading(false);
    }, 1500);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Narrative with Choices</h2>
      <div className="p-4 bg-white rounded-lg shadow-md">
        <NarrativeHistory 
          segments={segments}
          isLoading={isLoading}
        />
        
        {!isLoading && !currentChoice && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button
              className="p-3 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
              onClick={() => handleChoiceClick('left')}
            >
              Take the left path
            </button>
            <button
              className="p-3 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
              onClick={() => handleChoiceClick('right')}
            >
              Take the right path
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const GeneratingFromChoice: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-choice',
    triggerGeneration: false
  },
  render: GeneratingFromChoiceStory
};

// Loading state
function LoadingStateStory() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Loading State</h2>
      <div className="p-4 bg-white rounded-lg shadow-md">
        <NarrativeHistory 
          segments={[]}
          isLoading={true}
        />
      </div>
    </div>
  );
}

export const LoadingState: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-loading',
    triggerGeneration: true
  },
  render: LoadingStateStory
};

// Error state
function ErrorStateStory() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Error State</h2>
      <div className="p-4 bg-white rounded-lg shadow-md">
        <NarrativeHistory 
          segments={[]}
          isLoading={false}
          error="Failed to generate narrative. Please try again."
        />
      </div>
    </div>
  );
}

export const ErrorState: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-error',
    triggerGeneration: false
  },
  render: ErrorStateStory
};