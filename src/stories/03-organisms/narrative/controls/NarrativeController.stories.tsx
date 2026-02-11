import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { NarrativeHistory } from '@/components/Narrative/NarrativeHistory';
import { NarrativeSegment } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils';

const meta = {
  title: '03-Organisms/narrative/controls/NarrativeController',
  component: NarrativeController,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `# NarrativeController The NarrativeController manages the generation, storage, and display of narrative content. ## Features - Automatically generates initial narrative on mount - Maintains history of narrative segments - Handles player choices to generate new narrative segments - Displays loading and error states ## Usage \`\`\`jsx <NarrativeController worldId="world-123" sessionId="session-456" triggerGeneration={true} choiceId="choice-123" onNarrativeGenerated={(segment) => console.log('New segment:', segment)} /> \`\`\``,
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
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
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
    <div>
      <h2>NarrativeController Demo</h2>
      <div>
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
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
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
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
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
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
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
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
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
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
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
    <div>
      <h2>Narrative with Choices</h2>
      <div>
        <NarrativeHistory 
          segments={segments}
          isLoading={isLoading}
        />
        
        {!isLoading && !currentChoice && (
          <div>
            <button
              
              onClick={() => handleChoiceClick('left')}
            >
              Take the left path
            </button>
            <button
              
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
    <div>
      <h2>Loading State</h2>
      <div>
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

// Streaming stability simulation
function StreamingStabilityStory() {
  const [segments, setSegments] = React.useState<NarrativeSegment[]>([
    {
      id: 'seg-1',
      content: 'This is the initial narrative segment. The adventure is just beginning.',
      type: 'scene',
      sessionId: 'session-streaming',
      worldId: 'world-1',
      timestamp: new Date(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      metadata: { tags: [], mood: 'neutral' }
    }
  ]);
  const [isLoading, setIsLoading] = React.useState(false);

  const addSegment = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newSegment: NarrativeSegment = {
        id: `seg-${segments.length + 1}`,
        content: 'This new segment will be progressively revealed if the BUFFERED_STREAMING feature is enabled. This ensures that the UI remains stable and doesn\'t jump around as content is added, providing a better reading experience for the player.',
        type: 'scene',
        sessionId: 'session-streaming',
        worldId: 'world-1',
        timestamp: new Date(),
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
        metadata: { tags: [], mood: 'neutral' }
      };
      setSegments(prev => [...prev, newSegment]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <button 
          onClick={addSegment}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Add Streaming Segment'}
        </button>
      </div>
      <div className="h-[400px] border rounded overflow-hidden">
        <NarrativeHistory 
          segments={segments}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export const StreamingStability: Story = {
  render: StreamingStabilityStory,
  args: {
    worldId: 'world-1',
    sessionId: 'session-streaming',
    triggerGeneration: false
  }
};

// Error state
function ErrorStateStory() {
  return (
    <div>
      <h2>Error State</h2>
      <div>
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
