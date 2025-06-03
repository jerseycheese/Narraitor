/**
 * Storybook stories for LoreViewer component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LoreViewer } from './LoreViewer';
import { useLoreStore } from '../../state/loreStore';
import { useEffect } from 'react';

const meta: Meta<typeof LoreViewer> = {
  title: 'Narraitor/Journal/Display/LoreViewer',
  component: LoreViewer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Simple read-only viewer for displaying established lore facts to players.'
      }
    }
  },
  argTypes: {
    worldId: {
      control: 'text',
      description: 'The ID of the world to display lore facts for'
    },
    sessionId: {
      control: 'text', 
      description: 'Optional session ID to filter facts'
    }
  }
};

export default meta;
type Story = StoryObj<typeof LoreViewer>;

// Helper to populate store with sample data
const WithSampleData = ({ children }: { children: React.ReactNode }) => {
  const { addFact, clearFacts } = useLoreStore();

  useEffect(() => {
    clearFacts('storybook-world');
    
    // Add some sample facts
    addFact('hero_name', 'Lyra Starweaver', 'characters', 'manual', 'storybook-world');
    addFact('villain_name', 'Lord Shadowbane', 'characters', 'narrative', 'storybook-world');
    addFact('tavern_name', 'The Prancing Pony', 'locations', 'narrative', 'storybook-world');
    addFact('ancient_city', 'Ruins of Eldara', 'locations', 'manual', 'storybook-world');
    addFact('quest_start', 'The heroes met at the tavern', 'events', 'narrative', 'storybook-world');
    addFact('magic_cost', 'All magic requires sacrifice', 'rules', 'manual', 'storybook-world');
  }, [addFact, clearFacts]);

  return <>{children}</>;
};

/**
 * Default story with sample lore facts
 */
export const WithFacts: Story = {
  args: {
    worldId: 'storybook-world'
  },
  render: (args) => (
    <WithSampleData>
      <div className="max-w-3xl">
        <LoreViewer {...args} />
      </div>
    </WithSampleData>
  )
};

// Empty state wrapper
const EmptyWrapper = ({ worldId }: { worldId: string }) => {
  const { clearFacts } = useLoreStore();
  
  useEffect(() => {
    clearFacts('empty-world');
  }, [clearFacts]);

  return (
    <div className="max-w-3xl">
      <LoreViewer worldId={worldId} />
    </div>
  );
};

/**
 * Empty state when no facts exist
 */
export const Empty: Story = {
  args: {
    worldId: 'empty-world'
  },
  render: (args) => <EmptyWrapper {...args} />
};

// Session filtered wrapper
const SessionWrapper = ({ worldId, sessionId }: { worldId: string; sessionId?: string }) => {
  const { addFact, clearFacts } = useLoreStore();

  useEffect(() => {
    clearFacts('storybook-world');
    
    // Add facts with and without session IDs
    addFact('world_fact', 'General world information', 'rules', 'manual', 'storybook-world');
    addFact('session_fact_1', 'Player met the merchant', 'events', 'narrative', 'storybook-world', 'session-123');
    addFact('session_fact_2', 'Merchant gave quest', 'events', 'narrative', 'storybook-world', 'session-123');
    addFact('other_session', 'Different session event', 'events', 'narrative', 'storybook-world', 'session-456');
  }, [addFact, clearFacts]);

  return (
    <div className="max-w-3xl">
      <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
        Showing facts from session: {sessionId}
      </div>
      <LoreViewer worldId={worldId} sessionId={sessionId} />
    </div>
  );
};

/**
 * Session-specific facts
 */
export const SessionFiltered: Story = {
  args: {
    worldId: 'storybook-world',
    sessionId: 'session-123'
  },
  render: (args) => <SessionWrapper {...args} />
};