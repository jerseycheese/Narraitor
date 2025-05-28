/**
 * Storybook stories for LoreViewer component
 * Focused on meaningful scenarios for lore management
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LoreViewer } from './LoreViewer';
import { useLoreStore } from '../../state/loreStore';
import { useEffect } from 'react';
// Type imports included in useLoreStore

const meta: Meta<typeof LoreViewer> = {
  title: 'Narraitor/LoreViewer',
  component: LoreViewer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Comprehensive lore management component for tracking narrative facts and maintaining story consistency. Integrates with AI systems to provide context for narrative generation.'
      }
    }
  },
  argTypes: {
    worldId: {
      control: 'text',
      description: 'The ID of the world to display lore facts for'
    }
  }
};

export default meta;
type Story = StoryObj<typeof LoreViewer>;

// Helper to populate store with specific scenario data
const ScenarioWrapper = ({ 
  children, 
  scenario 
}: { 
  children: React.ReactNode; 
  scenario: 'game-session' | 'world-building' | 'narrative-extraction'
}) => {
  const { createFact, clearAllFacts } = useLoreStore();

  useEffect(() => {
    clearAllFacts();
    
    switch (scenario) {
      case 'game-session':
        // Active game session with recent narrative facts
        const sessionFacts = [
          {
            category: 'events' as const,
            title: 'The Tavern Encounter',
            content: 'Players met a mysterious hooded figure at the Prancing Pony who offered them a map to ancient ruins.',
            source: 'narrative' as const,
            tags: ['session-1', 'tavern', 'quest-start', 'mysterious-figure'],
            isCanonical: false,
            relatedFacts: [],
            worldId: 'storybook-world'
          },
          {
            category: 'characters' as const,
            title: 'The Hooded Stranger',
            content: 'A mysterious figure who knows about the ancient ruins. Speaks in riddles and seems to know more than they let on.',
            source: 'ai_generated' as const,
            tags: ['session-1', 'npc', 'quest-giver', 'mysterious'],
            isCanonical: false,
            relatedFacts: [],
            worldId: 'storybook-world'
          },
          {
            category: 'items' as const,
            title: 'Ancient Map',
            content: 'A weathered parchment showing the location of ruins in the Northern Wastes. Contains strange symbols.',
            source: 'narrative' as const,
            tags: ['session-1', 'quest-item', 'map', 'ancient'],
            isCanonical: false,
            relatedFacts: [],
            worldId: 'storybook-world'
          }
        ];
        sessionFacts.forEach(fact => createFact(fact));
        break;

      case 'world-building':
        // World creation with established canonical facts
        const worldFacts = [
          {
            category: 'rules' as const,
            title: 'The Law of Equivalent Exchange',
            content: 'All magic in this world requires sacrifice. The greater the spell, the greater the cost. This is an immutable law of nature.',
            source: 'manual' as const,
            tags: ['magic-system', 'world-rule', 'fundamental', 'important'],
            isCanonical: true,
            relatedFacts: [],
            worldId: 'storybook-world'
          },
          {
            category: 'locations' as const,
            title: 'The Sunken City of Atheros',
            content: 'Once the greatest city of the ancient empire, now lies beneath the waves. Its towers still visible at low tide, glowing with residual magic.',
            source: 'manual' as const,
            tags: ['ancient', 'city', 'sunken', 'magical', 'important'],
            isCanonical: true,
            relatedFacts: [],
            worldId: 'storybook-world'
          },
          {
            category: 'organizations' as const,
            title: 'The Circle of Mages',
            content: 'The governing body of all magical practitioners. They enforce the Laws of Magic and hunt rogue mages who violate them.',
            source: 'manual' as const,
            tags: ['magic', 'government', 'organization', 'law-enforcement'],
            isCanonical: true,
            relatedFacts: [],
            worldId: 'storybook-world'
          },
          {
            category: 'events' as const,
            title: 'The Great Sundering',
            content: 'The cataclysmic event 1000 years ago when uncontrolled magic tore the continent apart, creating the current island nations.',
            source: 'manual' as const,
            tags: ['historical', 'cataclysm', 'important', 'ancient'],
            isCanonical: true,
            relatedFacts: [],
            worldId: 'storybook-world'
          }
        ];
        worldFacts.forEach(fact => createFact(fact));
        break;

      case 'narrative-extraction':
        // Mixed facts from various sources including AI extraction
        const mixedFacts = [
          {
            category: 'characters' as const,
            title: 'Lord Commander Aldric',
            content: 'Extracted from narrative: The commander of the Northern Watch, known for his strategic brilliance.',
            source: 'ai_generated' as const,
            tags: ['military', 'commander', 'extracted', 'northern-watch'],
            isCanonical: false,
            relatedFacts: [],
            worldId: 'storybook-world'
          },
          {
            category: 'locations' as const,
            title: 'The Whispering Woods',
            content: 'Extracted from narrative: A dark forest where travelers hear voices of the lost. Many who enter never return.',
            source: 'narrative' as const,
            tags: ['forest', 'dangerous', 'extracted', 'mysterious'],
            isCanonical: false,
            relatedFacts: [],
            worldId: 'storybook-world'
          },
          {
            category: 'events' as const,
            title: 'Battle of Crimson Fields',
            content: 'Player decision resulted in this major battle. The outcome changed the political landscape of the realm.',
            source: 'narrative' as const,
            tags: ['battle', 'player-created', 'political', 'recent'],
            isCanonical: true,
            relatedFacts: [],
            worldId: 'storybook-world'
          },
          {
            category: 'rules' as const,
            title: 'Iron Cannot Pierce Magic',
            content: 'Discovered through gameplay: Non-magical weapons cannot harm creatures of pure magic.',
            source: 'narrative' as const,
            tags: ['combat', 'magic', 'discovered', 'game-rule'],
            isCanonical: true,
            relatedFacts: [],
            worldId: 'storybook-world'
          }
        ];
        mixedFacts.forEach(fact => createFact(fact));
        break;
    }
  }, [scenario, createFact, clearAllFacts]);

  return <>{children}</>;
};

/**
 * Active game session scenario with narrative-generated facts
 */
export const GameSession: Story = {
  args: {
    worldId: 'storybook-world'
  },
  render: (args) => (
    <ScenarioWrapper scenario="game-session">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Active Game Session</h2>
          <p className="text-blue-700 text-sm">
            During gameplay, facts are automatically extracted from the narrative and player decisions. 
            These non-canonical facts can be reviewed and promoted to canon by the game master.
          </p>
        </div>
        <LoreViewer {...args} />
      </div>
    </ScenarioWrapper>
  )
};

/**
 * World building scenario with canonical world facts
 */
export const WorldBuilding: Story = {
  args: {
    worldId: 'storybook-world'
  },
  render: (args) => (
    <ScenarioWrapper scenario="world-building">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <h2 className="text-lg font-semibold text-purple-900 mb-2">World Building Mode</h2>
          <p className="text-purple-700 text-sm">
            Establishing the fundamental rules, locations, and organizations of your world. 
            These canonical facts provide consistency constraints for AI narrative generation.
          </p>
        </div>
        <LoreViewer {...args} />
      </div>
    </ScenarioWrapper>
  )
};

/**
 * Mixed source scenario showing the fact extraction pipeline
 */
export const NarrativeExtraction: Story = {
  args: {
    worldId: 'storybook-world'
  },
  render: (args) => (
    <ScenarioWrapper scenario="narrative-extraction">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h2 className="text-lg font-semibold text-green-900 mb-2">AI Fact Extraction</h2>
          <p className="text-green-700 text-sm">
            Facts are automatically extracted from AI-generated narratives and player actions. 
            Review extracted facts, verify their accuracy, and promote important ones to canon.
          </p>
        </div>
        <LoreViewer {...args} />
      </div>
    </ScenarioWrapper>
  )
};

/**
 * Empty world ready for initial setup
 */
// Component wrapper for empty state
const EmptyWorldWrapper = ({ worldId }: { worldId: string }) => {
  const { clearAllFacts } = useLoreStore();
  
  useEffect(() => {
    clearAllFacts();
  }, [clearAllFacts]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 p-4 bg-amber-50 rounded-lg">
        <h2 className="text-lg font-semibold text-amber-900 mb-2">New World Setup</h2>
        <p className="text-amber-700 text-sm">
          Start building your world&apos;s lore from scratch. Add fundamental rules, key locations, 
          and important characters that will shape your narrative.
        </p>
      </div>
      <LoreViewer worldId={worldId} />
    </div>
  );
};

export const NewWorld: Story = {
  args: {
    worldId: 'empty-world'
  },
  render: (args) => <EmptyWorldWrapper {...args} />
};