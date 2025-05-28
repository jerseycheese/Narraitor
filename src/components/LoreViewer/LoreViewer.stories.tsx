/**
 * Storybook stories for LoreViewer component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LoreViewer } from './LoreViewer';
import { useLoreStore } from '../../state/loreStore';
import { useEffect } from 'react';

const meta: Meta<typeof LoreViewer> = {
  title: 'Components/LoreViewer',
  component: LoreViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive component for managing and displaying lore facts. Provides CRUD operations, search/filtering, and maintains narrative consistency.'
      }
    }
  },
  argTypes: {
    worldId: {
      control: 'text',
      description: 'The ID of the world to display lore facts for'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for styling'
    }
  }
};

export default meta;
type Story = StoryObj<typeof LoreViewer>;

// Sample lore facts for stories
const sampleFacts = [
  {
    category: 'characters' as const,
    title: 'Sir Gareth the Brave',
    content: 'A noble knight who defended the kingdom during the War of Shadows. Known for his unwavering courage and magical sword.',
    source: 'manual' as const,
    tags: ['knight', 'hero', 'war', 'magical-weapon'],
    isCanonical: true,
    relatedFacts: [],
    worldId: 'storybook-world'
  },
  {
    category: 'locations' as const,
    title: 'The Crystal Caves',
    content: 'Ancient underground caverns filled with luminous crystals. Legend says they hold the memories of the first dragons.',
    source: 'narrative' as const,
    tags: ['cave', 'crystals', 'ancient', 'dragons'],
    isCanonical: true,
    relatedFacts: [],
    worldId: 'storybook-world'
  },
  {
    category: 'events' as const,
    title: 'The Great Convergence',
    content: 'A celestial event that occurs every thousand years, when all three moons align and magic surges throughout the realm.',
    source: 'ai_generated' as const,
    tags: ['celestial', 'magic', 'rare-event'],
    isCanonical: false,
    relatedFacts: [],
    worldId: 'storybook-world'
  },
  {
    category: 'rules' as const,
    title: 'Law of Magical Balance',
    content: 'Every spell cast creates an equal and opposite magical disturbance somewhere in the world. Powerful mages must be careful.',
    source: 'manual' as const,
    tags: ['magic', 'law', 'balance'],
    isCanonical: true,
    relatedFacts: [],
    worldId: 'storybook-world'
  },
  {
    category: 'items' as const,
    title: 'The Orb of Infinite Sight',
    content: 'A mystical artifact that allows the wielder to see across vast distances and through illusions.',
    source: 'narrative' as const,
    tags: ['artifact', 'mystical', 'vision'],
    isCanonical: true,
    relatedFacts: [],
    worldId: 'storybook-world'
  },
  {
    category: 'organizations' as const,
    title: 'The Order of the Silver Dawn',
    content: 'An ancient guild of scholars and mages dedicated to preserving knowledge and protecting the realm from dark magic.',
    source: 'manual' as const,
    tags: ['guild', 'scholars', 'mages', 'protection'],
    isCanonical: true,
    relatedFacts: [],
    worldId: 'storybook-world'
  }
];

// Helper component to populate store with sample data
const StorybookWrapper = ({ children, facts = sampleFacts }: { children: React.ReactNode; facts?: typeof sampleFacts }) => {
  const { createFact, clearAllFacts } = useLoreStore();

  useEffect(() => {
    // Clear existing facts and populate with sample data
    clearAllFacts();
    facts.forEach(fact => {
      createFact(fact);
    });
  }, [facts, createFact, clearAllFacts]);

  return <>{children}</>;
};

/**
 * Default story with comprehensive lore data
 */
export const Default: Story = {
  args: {
    worldId: 'storybook-world'
  },
  render: (args) => (
    <StorybookWrapper>
      <div className="p-6 max-w-7xl mx-auto">
        <LoreViewer {...args} />
      </div>
    </StorybookWrapper>
  )
};

/**
 * Empty state when no facts exist
 */
export const EmptyState: Story = {
  args: {
    worldId: 'empty-world'
  },
  render: (args) => (
    <StorybookWrapper facts={[]}>
      <div className="p-6 max-w-7xl mx-auto">
        <LoreViewer {...args} />
      </div>
    </StorybookWrapper>
  )
};

/**
 * Loading state demonstration
 */
export const LoadingState: Story = {
  args: {
    worldId: 'storybook-world'
  },
  render: (args) => {
    const LoadingWrapper = () => {
      const { setLoading } = useLoreStore();
      
      useEffect(() => {
        setLoading(true);
        // Keep loading state for demo
        return () => setLoading(false);
      }, [setLoading]);

      return (
        <StorybookWrapper>
          <div className="p-6 max-w-7xl mx-auto">
            <LoreViewer {...args} />
          </div>
        </StorybookWrapper>
      );
    };
    
    return <LoadingWrapper />;
  }
};

/**
 * Error state demonstration
 */
export const ErrorState: Story = {
  args: {
    worldId: 'storybook-world'
  },
  render: (args) => {
    const ErrorWrapper = () => {
      const { setError } = useLoreStore();
      
      useEffect(() => {
        setError('Failed to load lore facts. Please try again.');
        return () => setError(null);
      }, [setError]);

      return (
        <StorybookWrapper>
          <div className="p-6 max-w-7xl mx-auto">
            <LoreViewer {...args} />
          </div>
        </StorybookWrapper>
      );
    };
    
    return <ErrorWrapper />;
  }
};

/**
 * Large dataset for performance testing
 */
export const LargeDataset: Story = {
  args: {
    worldId: 'large-world'
  },
  render: (args) => {
    // Generate 50 facts for performance testing
    const largeFacts = Array.from({ length: 50 }, (_, i) => ({
      category: (['characters', 'locations', 'events', 'rules', 'items', 'organizations'] as const)[i % 6],
      title: `Sample Fact ${i + 1}`,
      content: `This is sample lore fact number ${i + 1}. It contains information about various aspects of the world and helps maintain narrative consistency.`,
      source: (['manual', 'narrative', 'ai_generated'] as const)[i % 3],
      tags: [`tag-${i % 5}`, `category-${i % 3}`, 'sample'],
      isCanonical: i % 3 === 0,
      relatedFacts: [],
      worldId: 'large-world'
    }));

    return (
      <StorybookWrapper facts={largeFacts}>
        <div className="p-6 max-w-7xl mx-auto">
          <LoreViewer {...args} />
        </div>
      </StorybookWrapper>
    );
  }
};

/**
 * Mobile view demonstration
 */
export const MobileView: Story = {
  args: {
    worldId: 'storybook-world'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  render: (args) => (
    <StorybookWrapper>
      <div className="p-4">
        <LoreViewer {...args} />
      </div>
    </StorybookWrapper>
  )
};

/**
 * Tablet view demonstration
 */
export const TabletView: Story = {
  args: {
    worldId: 'storybook-world'
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  },
  render: (args) => (
    <StorybookWrapper>
      <div className="p-6">
        <LoreViewer {...args} />
      </div>
    </StorybookWrapper>
  )
};

/**
 * Interactive playground for testing all features
 */
export const Playground: Story = {
  args: {
    worldId: 'playground-world',
    className: 'border-2 border-dashed border-gray-300'
  },
  render: (args) => (
    <StorybookWrapper>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Interactive Playground</h2>
          <p className="text-blue-700 text-sm">
            Test all features: Create, edit, delete facts. Try searching and filtering. 
            Test the responsive design by changing viewport sizes.
          </p>
        </div>
        <LoreViewer {...args} />
      </div>
    </StorybookWrapper>
  )
};