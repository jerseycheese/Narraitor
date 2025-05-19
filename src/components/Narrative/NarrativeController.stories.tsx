import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeController } from './NarrativeController';
import { narrativeStore } from '@/state/narrativeStore';
import { NarrativeSegment } from '@/types/narrative.types';
import React, { useEffect } from 'react';

// Simple mock controller that always completes loading
const MockNarrativeController: React.FC<React.ComponentProps<typeof NarrativeController>> = ({
  worldId,
  sessionId,
  onNarrativeGenerated,
  triggerGeneration = true,
  choiceId,
  className
}) => {
  const [segments, setSegments] = React.useState<NarrativeSegment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error] = React.useState<string | null>(null);
  const [initialized, setInitialized] = React.useState(false);
  
  // Load existing segments on mount with a small delay to ensure store is populated
  useEffect(() => {
    if (!initialized) {
      const timer = setTimeout(() => {
        const existingSegments = narrativeStore.getState().getSessionSegments(sessionId);
        setSegments(existingSegments);
        setInitialized(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [sessionId, initialized]);

  // Generate narrative when triggered
  useEffect(() => {
    if (!triggerGeneration || !initialized) return;
    
    // Check if we should generate (only if no segments or choiceId provided)
    const shouldGenerate = segments.length === 0 || choiceId;
    if (!shouldGenerate) return;
    
    setIsLoading(true);
    
    // Simulate async generation
    const timer = setTimeout(() => {
      const newSegment: NarrativeSegment = {
        id: `seg-${Date.now()}`,
        content: segments.length === 0 
          ? 'You awaken in a mysterious forest. The air is thick with magic.'
          : `Your choice leads you deeper into the forest. ${choiceId ? `(from choice: ${choiceId})` : ''}`,
        type: segments.length === 0 ? 'scene' : 'exploration',
        sessionId,
        worldId,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setSegments(prev => [...prev, newSegment]);
      setIsLoading(false);
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [triggerGeneration, choiceId, initialized, segments.length]); // Track deps properly

  const NarrativeHistory = require('./NarrativeHistory').NarrativeHistory;
  
  return (
    <div className={`narrative-controller ${className || ''}`}>
      <NarrativeHistory 
        segments={segments}
        isLoading={isLoading}
        error={error || undefined}
      />
    </div>
  );
};

const meta = {
  title: 'Narraitor/Narrative/NarrativeController',
  component: MockNarrativeController as any,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => {
      // Reset the narrative store before each story
      useEffect(() => {
        narrativeStore.getState().reset();
      }, []);
      return <Story />;
    },
  ],
  argTypes: {
    worldId: {
      description: 'ID of the world for narrative generation',
      control: 'text',
    },
    sessionId: {
      description: 'ID of the game session',
      control: 'text',
    },
    triggerGeneration: {
      description: 'Whether to trigger narrative generation',
      control: 'boolean',
    },
    choiceId: {
      description: 'ID of the choice that triggered this narrative',
      control: 'text',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
    onNarrativeGenerated: {
      description: 'Callback when narrative is generated',
      action: 'narrative-generated',
    },
  },
} satisfies Meta<typeof MockNarrativeController>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for stories with existing segments
const WithExistingSegments: React.FC<{
  children: React.ReactNode;
  segments: Omit<NarrativeSegment, 'id'>[];
  sessionId: string;
}> = ({ children, segments, sessionId }) => {
  useEffect(() => {
    // Clear previous segments and add new ones
    narrativeStore.getState().reset();
    
    // Add mock segments to the store with proper structure
    segments.forEach((segment, index) => {
      const segmentToAdd = {
        content: segment.content,
        type: segment.type,
        worldId: segment.worldId,
        timestamp: segment.timestamp,
        updatedAt: segment.updatedAt,
        characterIds: segment.characterIds || [],
        metadata: segment.metadata || {}
      };
      
      narrativeStore.getState().addSegment(sessionId, segmentToAdd);
    });
  }, [segments, sessionId]);

  return <>{children}</>;
};

// Basic narrative controller
export const Default: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
  },
};

// With existing history
export const WithHistory: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-with-history',  // Unique session ID
    triggerGeneration: false,
  },
  decorators: [
    (Story, { args }) => (
      <WithExistingSegments
        sessionId={args.sessionId}
        segments={[
          {
            content: 'You stand at the entrance of the ancient temple.',
            type: 'scene',
            worldId: args.worldId,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            content: 'The door creaks open, revealing a dark corridor.',
            type: 'exploration',
            worldId: args.worldId,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]}
      >
        <Story />
      </WithExistingSegments>
    ),
  ],
};

// Generating next segment from choice
export const GeneratingFromChoice: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
    choiceId: 'choice-1',
  },
  decorators: [
    (Story, { args }) => (
      <WithExistingSegments
        sessionId={args.sessionId}
        segments={[
          {
            content: 'You face a fork in the road.',
            type: 'decision',
            worldId: args.worldId,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]}
      >
        <Story />
      </WithExistingSegments>
    ),
  ],
};

// Loading state - special component that stays in loading
const LoadingStory: React.FC<{ className?: string }> = ({ className }) => {
  const NarrativeHistory = require('./NarrativeHistory').NarrativeHistory;
  
  return (
    <div className={`narrative-controller ${className || ''}`}>
      <NarrativeHistory 
        segments={[]}
        isLoading={true}
        error={undefined}
      />
    </div>
  );
};

export const Loading: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
  },
  render: () => <LoadingStory />,
};

// Error state - special component that shows error
const ErrorStory: React.FC<{ className?: string }> = ({ className }) => {
  const NarrativeHistory = require('./NarrativeHistory').NarrativeHistory;
  
  return (
    <div className={`narrative-controller ${className || ''}`}>
      <NarrativeHistory 
        segments={[]}
        isLoading={false}
        error="Failed to generate narrative. Please try again."
      />
    </div>
  );
};

export const Error: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
  },
  render: () => <ErrorStory />,
};

// With custom styling
export const CustomStyled: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
    className: 'max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg shadow-lg',
  },
};

// Manual generation trigger
export const ManualTrigger: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: false,
  },
  render: (args) => {
    const [key, setKey] = React.useState(0);
    
    const handleGenerate = () => {
      setKey(prev => prev + 1); // Force new component instance
    };
    
    return (
      <div className="space-y-4">
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Generate Next Narrative
        </button>
        <MockNarrativeController 
          key={key} 
          {...args} 
          triggerGeneration={true}
          choiceId={`choice-${key}`}
        />
      </div>
    );
  },
};

// With callback
export const WithCallback: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
    onNarrativeGenerated: (segment: NarrativeSegment) => {
      console.log('Narrative generated:', segment);
    },
  },
};

// Continuous generation demo (for testing purposes only)
export const ContinuousGeneration: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: false,
  },
  render: (args) => {
    const [segments, setSegments] = React.useState<NarrativeSegment[]>([]);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const intervalRef = React.useRef<NodeJS.Timeout>();
    
    const startGeneration = () => {
      setIsGenerating(true);
      let counter = 0;
      
      intervalRef.current = setInterval(() => {
        const newSegment: NarrativeSegment = {
          id: `seg-${Date.now()}`,
          content: `Generated segment #${++counter}: The story continues with new adventures...`,
          type: 'scene',
          sessionId: args.sessionId,
          worldId: args.worldId,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setSegments(prev => [...prev, newSegment]);
        
        // Stop after 5 segments to prevent infinite generation
        if (counter >= 5) {
          stopGeneration();
        }
      }, 2000);
    };
    
    const stopGeneration = () => {
      setIsGenerating(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    
    React.useEffect(() => {
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, []);
    
    const NarrativeHistory = require('./NarrativeHistory').NarrativeHistory;
    
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={startGeneration}
            disabled={isGenerating}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Start Continuous Generation
          </button>
          <button
            onClick={stopGeneration}
            disabled={!isGenerating}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Stop Generation
          </button>
          <span className="text-sm text-gray-600 self-center">
            {isGenerating ? 'Generating...' : `${segments.length} segments generated`}
          </span>
        </div>
        <NarrativeHistory segments={segments} isLoading={isGenerating} />
      </div>
    );
  },
};