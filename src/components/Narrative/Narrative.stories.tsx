import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeController } from './NarrativeController';
import { NarrativeDisplay } from './NarrativeDisplay';
import { NarrativeHistory } from './NarrativeHistory';

const meta = {
  title: 'Narrative',
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
  render: () => {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Narrative System Demo</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <NarrativeController
              worldId="demo-world"
              sessionId="demo-session"
              triggerGeneration={true}
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