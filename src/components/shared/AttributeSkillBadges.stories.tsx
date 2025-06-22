// src/components/shared/AttributeSkillBadges.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { AttributeSkillBadges, TopAttributesBadges, TopSkillsBadges } from './AttributeSkillBadges';

const meta: Meta<typeof AttributeSkillBadges> = {
  title: 'Narraitor/Shared/AttributeSkillBadges',
  component: AttributeSkillBadges,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A reusable component for displaying character attributes or skills as badges.
Automatically sorts by value/level and shows the top N items with optional remaining count.

## Features
- **Automatic Sorting**: Sorts items by value (attributes) or level (skills) in descending order
- **Configurable Display**: Show top N items with customizable maximum
- **Remaining Count**: Optional indicator when items exceed the display limit
- **Badge Variants**: Supports all badge styling variants
- **Type Safety**: Handles both attribute and skill data structures
- **Performance**: Memoized sorting for efficiency

## Usage
Use the preset components \`TopAttributesBadges\` and \`TopSkillsBadges\` for common cases,
or use the base \`AttributeSkillBadges\` component for custom configurations.
        `,
      },
    },
  },
  argTypes: {
    items: {
      description: 'Array of attributes or skills to display',
      control: 'object',
    },
    maxItems: {
      description: 'Maximum number of items to display',
      control: { type: 'number', min: 1, max: 10 },
    },
    variant: {
      description: 'Badge styling variant',
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
    type: {
      description: 'Type of items for appropriate sorting and labeling',
      control: 'select',
      options: ['attributes', 'skills'],
    },
    showRemainingCount: {
      description: 'Show remaining count when items exceed maxItems',
      control: 'boolean',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for stories
const sampleAttributes = [
  { id: 'str', name: 'Strength', value: 8 },
  { id: 'int', name: 'Intelligence', value: 6 },
  { id: 'dex', name: 'Dexterity', value: 7 },
  { id: 'con', name: 'Constitution', value: 5 },
  { id: 'wis', name: 'Wisdom', value: 4 },
  { id: 'cha', name: 'Charisma', value: 3 },
];

const sampleSkills = [
  { id: 'combat', name: 'Combat', level: 9 },
  { id: 'magic', name: 'Magic', level: 7 },
  { id: 'stealth', name: 'Stealth', level: 6 },
  { id: 'survival', name: 'Survival', level: 4 },
  { id: 'diplomacy', name: 'Diplomacy', level: 3 },
  { id: 'crafting', name: 'Crafting', level: 2 },
];

/**
 * Default attributes display showing top 3 with remaining count
 */
export const AttributesDefault: Story = {
  args: {
    items: sampleAttributes,
    maxItems: 3,
    variant: 'secondary',
    type: 'attributes',
    showRemainingCount: true,
  },
};

/**
 * Skills display with outline variant
 */
export const SkillsOutline: Story = {
  args: {
    items: sampleSkills,
    maxItems: 3,
    variant: 'outline',
    type: 'skills',
    showRemainingCount: true,
  },
};

/**
 * Show all items without limit
 */
export const ShowAllItems: Story = {
  args: {
    items: sampleAttributes,
    maxItems: 10,
    variant: 'default',
    type: 'attributes',
    showRemainingCount: false,
  },
};

/**
 * Minimal display with only top item
 */
export const TopItemOnly: Story = {
  args: {
    items: sampleSkills,
    maxItems: 1,
    variant: 'destructive',
    type: 'skills',
    showRemainingCount: true,
  },
};

/**
 * Using the TopAttributesBadges preset component
 */
export const PresetAttributes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Character Attributes</h3>
        <TopAttributesBadges items={sampleAttributes} maxItems={3} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Using the TopAttributesBadges preset for consistent attribute display.',
      },
    },
  },
};

/**
 * Using the TopSkillsBadges preset component
 */
export const PresetSkills: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Character Skills</h3>
        <TopSkillsBadges items={sampleSkills} maxItems={3} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Using the TopSkillsBadges preset for consistent skill display.',
      },
    },
  },
};

/**
 * Empty state handling
 */
export const EmptyState: Story = {
  args: {
    items: [],
    maxItems: 3,
    variant: 'secondary',
    type: 'attributes',
    showRemainingCount: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component gracefully handles empty item arrays.',
      },
    },
  },
};

/**
 * Character archetype example
 */
export const ArchetypeExample: Story = {
  render: () => (
    <div className="max-w-md p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Aelric the Brave</h3>
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Attributes</h4>
          <TopAttributesBadges items={sampleAttributes} maxItems={3} showRemainingCount={false} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Best Skills</h4>
          <TopSkillsBadges items={sampleSkills} maxItems={3} showRemainingCount={false} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example usage in a character archetype card, matching QuickStartCharacters implementation.',
      },
    },
  },
};