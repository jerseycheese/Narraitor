import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeHistory } from '@/components/Narrative/NarrativeHistory';
import { NarrativeSegment } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils';
// NarrativeController and NarrativeDisplay are imported in docstrings but not directly used in this file

const meta = {
  title: '03-Organisms/narrative/core/Narrative',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `# Narrative System Components The Narrative system consists of several interconnected components: - **NarrativeDisplay**: Shows individual narrative segments with type-specific styling - **NarrativeHistory**: Displays a scrollable history of narrative segments - **NarrativeController**: Manages narrative generation and history tracking These components work together to create immersive, AI-driven narrative experiences in Narraitor.`,
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
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
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
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
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
      <div >
        <div >
          <h1 >Narrative System Demo</h1>
          
          <div >
            <NarrativeHistory
              segments={segments}
              isLoading={isLoading}
              
            />
          </div>
          
          <div >
            <p >
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
