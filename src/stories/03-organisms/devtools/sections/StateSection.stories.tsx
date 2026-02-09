import type { StoryObj } from '@storybook/react';
import React from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { JsonViewer } from '@/components/devtools/JsonViewer/JsonViewer';

/**
 * Mock StateSection Component
 * 
 * This is a simplified version of the actual StateSection component
 * that doesn't depend on importing the actual stores,
 * making it more reliable for Storybook.
 */
const MockStateSection = () => {
  // Static mock data for Storybook
  const mockStores = {
    worldStore: {
      worlds: {
        'world-1': { id: 'world-1', name: 'Fantasy World' },
        'world-2': { id: 'world-2', name: 'Sci-Fi World' }
      },
      currentWorld: 'world-1',
      loading: false
    },
    gameStore: {
      gameMode: 'narrative',
      session: {
        id: 'session-1',
        startTime: '2025-05-17T10:00:00Z',
        currentScene: 'tavern'
      },
      loading: false
    },
    characterStore: {
      characters: {
        'char-1': {
          id: 'char-1',
          name: 'Hero',
          attributes: [
            { id: 'str', value: 8 },
            { id: 'int', value: 6 }
          ]
        }
      },
      currentCharacter: 'char-1'
    }
  };

  return (
    <div data-testid="devtools-state-section" >
      <h2 >Application State</h2>
      
      {Object.entries(mockStores).map(([storeName, storeState]) => (
        <CollapsibleSection 
          key={storeName}
          title={storeName}
          data-testid={`store-section-${storeName}`}
        >
          <JsonViewer data={storeState} />
        </CollapsibleSection>
      ))}
    </div>
  );
};

const meta = {
  title: '03-Organisms/devtools/sections/StateSection',
  component: MockStateSection,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A section that displays the current state of all Zustand stores'
      }
    }
  },
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType) => (
      <div >
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof MockStateSection>;

export const Default: Story = {
  args: {}
};
