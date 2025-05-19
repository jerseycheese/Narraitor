import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeController } from '@/components/Narrative/NarrativeController';

const meta = {
  title: 'Narraitor/Narrative/NarrativeController',
  component: NarrativeController,
  parameters: {
    layout: 'centered',
    // Let's create a mock context that our component can use
    mockNarrativeResponse: {
      default: {
        content: 'You find yourself standing at the edge of an ancient forest. The trees tower above you, their leaves whispering secrets in a language older than time itself.',
        segmentType: 'scene',
        metadata: {
          characterIds: [],
          location: 'Forest Edge',
          mood: 'mysterious',
          tags: ['forest', 'beginning', 'mystery']
        }
      },
      continuation: {
        content: 'As you venture deeper into the forest, the air grows thick with magic. Strange lights dance between the trees, and you hear the distant sound of ethereal music.',
        segmentType: 'scene',
        metadata: {
          characterIds: [],
          location: 'Deep Forest',
          mood: 'mysterious',
          tags: ['forest', 'magic', 'exploration']
        }
      }
    }
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '600px', minHeight: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NarrativeController>;

export default meta;
type Story = StoryObj<typeof meta>;

// Since we can't easily mock dependencies in Storybook, let's create a wrapper component
// that simulates the behavior we want to demonstrate
const NarrativeControllerDemo: React.FC<{ 
  worldId: string; 
  sessionId: string;
  simulateError?: boolean;
  simulateDelay?: number;
}> = ({ worldId, sessionId, simulateError, simulateDelay }) => {
  const [mockSegment, setMockSegment] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadNarrative = async () => {
      setLoading(true);
      setError(null);
      
      if (simulateDelay) {
        await new Promise(resolve => setTimeout(resolve, simulateDelay));
      }
      
      if (simulateError) {
        setError('Failed to connect to AI service');
        setLoading(false);
        return;
      }
      
      setMockSegment({
        id: 'seg-1',
        content: 'You find yourself standing at the edge of an ancient forest. The trees tower above you, their leaves whispering secrets in a language older than time itself.',
        type: 'scene',
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          characterIds: [],
          location: 'Forest Edge',
          mood: 'mysterious',
          tags: ['forest', 'beginning', 'mystery']
        }
      });
      setLoading(false);
    };
    
    loadNarrative();
  }, [simulateError, simulateDelay]);

  // Use the actual components but provide mock data
  return (
    <div className="narrative-controller space-y-6">
      <NarrativeDisplay 
        segment={mockSegment} 
        isLoading={loading} 
        error={error} 
      />
      
      {mockSegment && !loading && !error && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setMockSegment({
                ...mockSegment,
                id: 'seg-2',
                content: 'As you venture deeper into the forest, the air grows thick with magic. Strange lights dance between the trees.',
              });
            }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

// Import the display component we need
import { NarrativeDisplay } from '@/components/Narrative/NarrativeDisplay';

export const Default: Story = {
  render: () => <NarrativeControllerDemo worldId="world-story" sessionId="session-story" />,
};

export const Loading: Story = {
  render: () => <NarrativeControllerDemo worldId="world-story" sessionId="session-story" simulateDelay={10000} />,
};

export const WithError: Story = {
  render: () => <NarrativeControllerDemo worldId="world-story" sessionId="session-story" simulateError={true} />,
};