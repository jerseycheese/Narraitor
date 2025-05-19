import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeController } from './NarrativeController';
import { narrativeStore } from '@/state/narrativeStore';
import { NarrativeSegment } from '@/types/narrative.types';
import React, { useEffect } from 'react';
import { NarrativeHistory } from './NarrativeHistory';

const meta = {
  title: 'Narraitor/Narrative/NarrativeController',
  component: NarrativeController,
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
} satisfies Meta<typeof NarrativeController>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock narrative controller for simulating behavior
const MockNarrativeController: React.FC<React.ComponentProps<typeof NarrativeController> & { mockSegments?: NarrativeSegment[] }> = ({
  worldId,
  sessionId,
  onNarrativeGenerated,
  triggerGeneration = true,
  choiceId,
  className,
  mockSegments = []
}) => {
  const [segments, setSegments] = React.useState<NarrativeSegment[]>(mockSegments);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasGenerated, setHasGenerated] = React.useState(false);
  
  // Generate new segment when triggered
  useEffect(() => {
    if (triggerGeneration && !hasGenerated && segments.length === 0) {
      setIsLoading(true);
      setHasGenerated(true);
      
      const timer = setTimeout(() => {
        const newSegment: NarrativeSegment = {
          id: `seg-${Date.now()}`,
          content: 'You awaken in a mysterious forest. The air is thick with magic.',
          type: 'scene',
          sessionId,
          worldId,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setSegments([newSegment]);
        setIsLoading(false);
        
        if (onNarrativeGenerated) {
          onNarrativeGenerated(newSegment);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [triggerGeneration, hasGenerated, segments.length, sessionId, worldId, onNarrativeGenerated]);
  
  return (
    <div className={`narrative-controller ${className || ''}`}>
      <NarrativeHistory 
        segments={segments}
        isLoading={isLoading}
        error={undefined}
      />
    </div>
  );
};

// Basic narrative controller
export const Default: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
  },
  render: (args) => <MockNarrativeController {...args} />,
};

// With existing history - directly pass segments as props
export const WithHistory: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-with-history',
    triggerGeneration: false,
  },
  render: (args) => {
    const mockSegments: NarrativeSegment[] = [
      {
        id: 'seg-1',
        content: 'You stand at the entrance of the ancient temple.',
        type: 'scene',
        sessionId: args.sessionId,
        worldId: args.worldId,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seg-2',
        content: 'The door creaks open, revealing a dark corridor.',
        type: 'exploration',
        sessionId: args.sessionId,
        worldId: args.worldId,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    return <MockNarrativeController {...args} mockSegments={mockSegments} />;
  },
};

// Generating next segment from choice
export const GeneratingFromChoice: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-with-choice',
    triggerGeneration: true,
    choiceId: 'choice-1',
  },
  render: (args) => {
    const [segments, setSegments] = React.useState<NarrativeSegment[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    
    useEffect(() => {
      // Set initial segment
      setSegments([{
        id: 'seg-1',
        content: 'You face a fork in the road.',
        type: 'decision',
        sessionId: args.sessionId,
        worldId: args.worldId,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]);
      
      // Generate next segment after a delay
      if (args.triggerGeneration && args.choiceId) {
        setIsLoading(true);
        const timer = setTimeout(() => {
          const newSegment: NarrativeSegment = {
            id: `seg-${Date.now()}`,
            content: `Your choice leads you deeper into the forest. (from choice: ${args.choiceId})`,
            type: 'exploration',
            sessionId: args.sessionId,
            worldId: args.worldId,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          setSegments(prev => [...prev, newSegment]);
          setIsLoading(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }, [args]);
    
    return (
      <NarrativeHistory segments={segments} isLoading={isLoading} />
    );
  },
};

// Loading state - perpetual loading
export const Loading: Story = {
  render: () => <NarrativeHistory segments={[]} isLoading={true} />,
};

// Initial state before any generation
export const InitialState: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-initial',
    triggerGeneration: false,
  },
  render: (args) => <MockNarrativeController {...args} />,
};

// Error state
export const Error: Story = {
  render: () => <NarrativeHistory segments={[]} isLoading={false} error="Failed to generate narrative. Please try again." />,
};

// With custom styling
export const CustomStyled: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
    className: 'max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg shadow-lg',
  },
  render: (args) => <MockNarrativeController {...args} />,
};

// Manual generation trigger
export const ManualTrigger: Story = {
  render: () => {
    const [segments, setSegments] = React.useState<NarrativeSegment[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    
    const handleGenerate = () => {
      setIsLoading(true);
      
      setTimeout(() => {
        const newSegment: NarrativeSegment = {
          id: `seg-${Date.now()}`,
          content: `Generated narrative segment #${segments.length + 1}`,
          type: segments.length === 0 ? 'scene' : 'exploration',
          sessionId: 'manual-session',
          worldId: 'world-1',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setSegments(prev => [...prev, newSegment]);
        setIsLoading(false);
      }, 1000);
    };
    
    return (
      <div className="space-y-4">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Generate Next Narrative
        </button>
        <NarrativeHistory segments={segments} isLoading={isLoading} />
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
  render: (args) => <MockNarrativeController {...args} />,
};

// Multiple segments
export const MultipleSegments: Story = {
  render: () => {
    const mockSegments: NarrativeSegment[] = Array.from({ length: 5 }, (_, i) => ({
      id: `seg-${i}`,
      content: `This is narrative segment ${i + 1}. ${i === 0 ? 'The journey begins in a misty forest.' : `The adventure continues with more discoveries.`}`,
      type: i % 2 === 0 ? 'scene' : 'exploration',
      sessionId: 'multi-session',
      worldId: 'world-1',
      timestamp: new Date(Date.now() - (5 - i) * 60000).toISOString(), // Stagger timestamps
      createdAt: new Date(Date.now() - (5 - i) * 60000).toISOString(),
      updatedAt: new Date(Date.now() - (5 - i) * 60000).toISOString(),
    }));
    
    return <NarrativeHistory segments={mockSegments} isLoading={false} />;
  },
};