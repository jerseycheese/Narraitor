import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { NarrativeDisplay } from '@/components/Narrative/NarrativeDisplay';

const meta = {
  title: 'Narraitor/Narrative/NarrativeController',
  component: NarrativeController,
  parameters: {
    layout: 'centered',
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

// Simulate how the NarrativeController would work with PlayerChoices
const NarrativeGameSessionDemo: React.FC<{ 
  simulateError?: boolean;
  simulateDelay?: number;
}> = ({ simulateError, simulateDelay }) => {
  const [currentSegment, setCurrentSegment] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = React.useState<string | null>(null);

  // Mock player choices
  const mockChoices = [
    { id: 'explore', text: 'Explore the ancient ruins ahead' },
    { id: 'camp', text: 'Make camp for the night' },
    { id: 'investigate', text: 'Investigate the strange sounds' }
  ];

  React.useEffect(() => {
    const loadInitialNarrative = async () => {
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
      
      setCurrentSegment({
        id: 'seg-1',
        content: 'You stand at the entrance to the Valley of Forgotten Dreams. Ancient stone pillars rise from the mist, their surfaces carved with symbols that seem to shift when you\'re not looking directly at them. The air is thick with magic and possibility.',
        type: 'scene',
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          characterIds: [],
          location: 'Valley Entrance',
          mood: 'mysterious',
          tags: ['exploration', 'beginning', 'mystery']
        }
      });
      setLoading(false);
    };
    
    loadInitialNarrative();
  }, [simulateError, simulateDelay]);

  const handleChoiceSelected = async (choiceId: string) => {
    setSelectedChoice(choiceId);
    setLoading(true);
    
    // Simulate narrative generation based on choice
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const narrativeResponses: Record<string, any> = {
      explore: {
        content: 'You step forward into the ruins. The ancient stones seem to hum with a forgotten power as you pass between the towering pillars. Ahead, a grand staircase descends into darkness, while to your right, a narrow path winds between crumbling walls.',
        metadata: { location: 'Ancient Ruins', mood: 'mysterious' }
      },
      camp: {
        content: 'You decide to set up camp before venturing further. As you gather wood for a fire, you notice strange markings on the nearby stones that glow faintly in the twilight. The night promises to be long and full of whispers.',
        metadata: { location: 'Valley Camp', mood: 'tense' }
      },
      investigate: {
        content: 'Following the mysterious sounds, you discover a hidden grotto behind a waterfall. Inside, bioluminescent plants cast an ethereal blue light on the walls, revealing more of those shifting symbols.',
        metadata: { location: 'Hidden Grotto', mood: 'mysterious' }
      }
    };
    
    const response = narrativeResponses[choiceId];
    setCurrentSegment({
      id: `seg-${Date.now()}`,
      content: response.content,
      type: 'scene',
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...response.metadata,
        characterIds: [],
        tags: ['choice', choiceId]
      }
    });
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Narrative Display */}
      <NarrativeDisplay 
        segment={currentSegment} 
        isLoading={loading} 
        error={error} 
      />
      
      {/* Player Choices - mimicking the actual PlayerChoices component */}
      {currentSegment && !loading && !error && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">What will you do?</h3>
          <div className="space-y-2">
            {mockChoices.map((choice) => (
              <button
                key={choice.id}
                className={`block w-full text-left p-3 border rounded transition-colors ${
                  selectedChoice === choice.id
                    ? 'bg-blue-100 border-blue-500 font-bold'
                    : 'bg-white hover:bg-gray-50 cursor-pointer'
                }`}
                onClick={() => handleChoiceSelected(choice.id)}
              >
                {selectedChoice === choice.id ? '➤ ' : ''}{choice.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Default: Story = {
  render: () => <NarrativeGameSessionDemo />,
};

export const Loading: Story = {
  render: () => <NarrativeGameSessionDemo simulateDelay={10000} />,
};

export const WithError: Story = {
  render: () => <NarrativeGameSessionDemo simulateError={true} />,
};

// Create a wrapper that provides mock data directly to NarrativeDisplay
const IsolatedNarrativeDemo: React.FC = () => {
  const [mockSegment] = React.useState({
    id: 'demo-seg-1',
    content: 'The morning sun cast long shadows across the cobblestone streets of the ancient city. You can hear the distant sound of merchants setting up their stalls in the market square.',
    type: 'scene' as const,
    timestamp: new Date(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      characterIds: [],
      location: 'Ancient City - Market District',
      mood: 'relaxed' as const,
      tags: ['morning', 'city', 'peaceful']
    }
  });

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">
        This shows the NarrativeController component with mock data. 
        In actual usage, it would be integrated with PlayerChoices and connected to the AI service.
      </p>
      <div className="narrative-controller">
        <NarrativeDisplay 
          segment={mockSegment} 
          isLoading={false} 
          error={undefined} 
        />
      </div>
    </div>
  );
};

// Story showing just the component with mock data
export const ComponentOnly: Story = {
  render: () => <IsolatedNarrativeDemo />
};