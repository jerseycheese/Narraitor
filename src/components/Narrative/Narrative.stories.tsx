import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeHistory } from './NarrativeHistory';
import { NarrativeSegment } from '@/types/narrative.types';
// NarrativeController and NarrativeDisplay are imported in docstrings but not directly used in this file

const meta = {
  title: 'Narraitor/Narrative/Display/Narrative',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
        # Narrative System Components
        
        The Narrative system consists of several interconnected components:
        
        - **NarrativeDisplay**: Shows individual narrative segments with type-specific styling
        - **NarrativeHistory**: Displays a scrollable history of narrative segments
        - **NarrativeController**: Manages narrative generation and history tracking
        
        These components work together to create immersive, AI-driven narrative experiences in Narraitor.
        `,
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Full narrative system demo
export const CompleteNarrativeSystem: Story = {
  render: function NarrativeSystemStory() {
    const [segments, setSegments] = React.useState<NarrativeSegment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    
    React.useEffect(() => {
      // Simulate initial generation
      const timer = setTimeout(() => {
        setSegments([
          {
            id: 'seg-1',
            content: 'Welcome to the Narrative System Demo. The story begins in a mystical realm where magic flows through every living thing.',
            type: 'scene',
            sessionId: 'demo-session',
            worldId: 'demo-world',
            timestamp: new Date(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: { 
              tags: ['opening', 'introduction'], 
              mood: 'mysterious' 
            },
          },
          {
            id: 'seg-2',
            content: 'As you explore this new world, you encounter various characters and face important decisions that shape your journey.',
            type: 'action',  // Changed from exploration to match valid types
            sessionId: 'demo-session',
            worldId: 'demo-world',
            timestamp: new Date(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: { 
              tags: ['exploration', 'journey'], 
              mood: 'neutral' 
            },
          },
        ]);
        setIsLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Narrative System Demo</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <NarrativeHistory
              segments={segments}
              isLoading={isLoading}
              className="space-y-4"
            />
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              This demo shows the complete narrative system in action. The NarrativeController
              manages generation and history, while NarrativeHistory displays all segments
              using NarrativeDisplay components.
            </p>
          </div>
        </div>
      </div>
    );
  },
};
