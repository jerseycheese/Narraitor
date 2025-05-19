import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeController } from './NarrativeController';
import { narrativeStore } from '@/state/narrativeStore';
import { NarrativeSegment } from '@/types/narrative.types';
import React, { useEffect } from 'react';

// Mock the defaultGeminiClient and narrativeGenerator
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => ({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () => 'Generated narrative content',
      },
    }),
  }),
}));

jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateInitialScene: jest.fn().mockResolvedValue({
      content: 'You awaken in a mysterious forest. The air is thick with magic.',
      segmentType: 'scene',
    }),
    generateSegment: jest.fn().mockResolvedValue({
      content: 'Your choice leads you deeper into the forest.',
      segmentType: 'exploration',
    }),
  })),
}));

const meta = {
  title: 'Components/Narrative/NarrativeController',
  component: NarrativeController,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => {
      // Reset the narrative store before each story
      useEffect(() => {
        narrativeStore.getState().clearAllSegments();
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

// Helper component for stories with existing segments
const WithExistingSegments: React.FC<{
  children: React.ReactNode;
  segments: Omit<NarrativeSegment, 'id'>[];
  sessionId: string;
}> = ({ children, segments, sessionId }) => {
  useEffect(() => {
    // Add mock segments to the store
    segments.forEach((segment, index) => {
      narrativeStore.getState().addSegment(sessionId, {
        ...segment,
        id: `mock-seg-${index}`,
      } as Omit<NarrativeSegment, 'sessionId'>);
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
    sessionId: 'session-1',
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

// Loading state
export const Loading: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
  },
  decorators: [
    (Story) => {
      // Override the mock to simulate loading
      const NarrativeGenerator = require('@/lib/ai/narrativeGenerator').NarrativeGenerator;
      NarrativeGenerator.mockImplementation(() => ({
        generateInitialScene: () => new Promise(() => {}), // Never resolves
      }));
      return <Story />;
    },
  ],
};

// Error state
export const Error: Story = {
  args: {
    worldId: 'world-1',
    sessionId: 'session-1',
    triggerGeneration: true,
  },
  decorators: [
    (Story) => {
      // Override the mock to simulate error
      const NarrativeGenerator = require('@/lib/ai/narrativeGenerator').NarrativeGenerator;
      NarrativeGenerator.mockImplementation(() => ({
        generateInitialScene: () => Promise.reject(new Error('Generation failed')),
      }));
      return <Story />;
    },
  ],
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
    const [trigger, setTrigger] = React.useState(false);
    
    return (
      <div className="space-y-4">
        <button
          onClick={() => setTrigger(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Generate Narrative
        </button>
        <NarrativeController {...args} triggerGeneration={trigger} />
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