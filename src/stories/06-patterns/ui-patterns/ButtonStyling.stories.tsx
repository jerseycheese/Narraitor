import type { Meta, StoryObj } from '@storybook/react';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { Plus, Sparkles, Play, Eye, Pencil, CheckCircle } from 'lucide-react';

/**
 * # Button Styling Guidelines & Patterns
 *
 * This story documents the consistent button styling patterns and design system rules
 * used throughout Narraitor. Follow these patterns to ensure visual consistency
 * and proper use of design system colors.
 *
 * ## Design System Colors Only
 *
 * All buttons must use colors from `/docs/design-system/design-tokens.md`:
 * - **Blue**: `blue-700`, `blue-900` (primary actions)
 * - **Gray**: `gray-700`, `gray-500` (secondary/neutral actions)
 * - **Green**: `green-500`, `green-700` (success/play actions)
 * - **Red**: `red-500`, `red-700` (destructive actions)
 * - **Amber**: `amber-500`, `amber-700` (warning actions)
 *
 * ## Semantic Button Variants
 *
 * - **primary**: Blue buttons for main actions (Create, Edit, View)
 * - **secondary**: Gray buttons for supporting actions (Make Active, Cancel)
 * - **success**: Green buttons for positive goal actions (Play, Start)
 * - **danger**: Red buttons for destructive actions (Delete, Remove)
 *
 * ## Button Ordering Guidelines
 *
 * Order buttons by priority and user workflow:
 * 1. **Context/Setup actions first** (Make Active)
 * 2. **Content management** (Create, Edit, View)
 * 3. **Primary goal action last** (Play, Start) - this gets the most emphasis
 *
 * Examples:
 * - World cards: `Make Active` → `Manage Characters` → `Play`
 * - Character pages: `Create Character` → `Generate Character` → `Start Playing`
 *
 * ## Icon Usage Guidelines
 *
 * Icons should be used consistently across all buttons to improve recognition and usability:
 *
 * **Required Icons by Action Type:**
 * - **Create/Add**: Plus icon (`M12 6v6m0 0v6m0-6h6m-6 0H6`)
 * - **Play/Start**: Play circle icon (`M14.752 11.168l-3.197-2.132...` + `M21 12a9 9 0 11-18 0 9 9 0 0118 0z`)
 * - **Generate**: Lightbulb icon (`M9.663 17h4.673M12 3v1m6.364 1.636...`)
 * - **Edit**: Edit icon (when needed)
 * - **View**: Eye icon (when needed)
 * - **Delete**: Trash icon (when needed)
 *
 * **Icon Standards:**
 * - Size: `` for default buttons, `` for large buttons
 * - Style: `fill="none" stroke="currentColor" viewBox="0 0 24 24"`
 * - Stroke: `strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}`
 */

const meta: Meta<typeof ActionButtonGroup> = {
  title: '06-Patterns/ui-patterns/Button Styling Guidelines',
  component: ActionButtonGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Design system compliant button patterns and styling guidelines for consistent UI.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActionButtonGroup>;

// Correct button ordering and colors
export const WorldDetailPageButtons: Story = {
  args: {
    actions: [
      {
        label: 'Make Active',
        onClick: () => console.log('Make Active clicked'),
        variant: 'secondary', // Gray - neutral context action
      },
      {
        label: 'View Characters',
        onClick: () => console.log('View Characters clicked'),
        variant: 'primary', // Blue - content management
      },
      {
        label: 'Edit World',
        onClick: () => console.log('Edit World clicked'),
        variant: 'secondary', // Gray - supporting action
      },
      {
        label: 'Play in World',
        onClick: () => console.log('Play clicked'),
        variant: 'success', // Green - primary goal action (last)
        icon: <Play aria-hidden="true" />,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          '✅ **Correct Example**: World detail page buttons with proper ordering and colors. Goal action (Play) comes last with green success styling.',
      },
    },
  },
};

export const CharacterPageButtons: Story = {
  args: {
    actions: [
      {
        label: 'Create Character',
        onClick: () => console.log('Create clicked'),
        variant: 'primary', // Blue - main content action
        icon: <Plus aria-hidden="true" />,
      },
      {
        label: 'Generate Character',
        onClick: () => console.log('Generate clicked'),
        variant: 'secondary', // Gray - alternative creation method
        icon: <Sparkles aria-hidden="true" />,
      },
      {
        label: 'Start Playing',
        onClick: () => console.log('Play clicked'),
        variant: 'success', // Green - primary goal action (last)
        icon: <Play aria-hidden="true" />,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          '✅ **Correct Example**: Character page buttons with proper ordering. Content actions first, then primary goal (Start Playing) last.',
      },
    },
  },
};

export const DestructiveActionPattern: Story = {
  args: {
    actions: [
      {
        label: 'Cancel',
        onClick: () => console.log('Cancel clicked'),
        variant: 'secondary', // Gray - neutral action
      },
      {
        label: 'Delete World',
        onClick: () => console.log('Delete clicked'),
        variant: 'danger', // Red - destructive action
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          '✅ **Correct Example**: Destructive actions use red `danger` variant and come after neutral actions.',
      },
    },
  },
};

// Anti-patterns to avoid
export const IncorrectHardcodedColors: Story = {
  name: '✅ Fixed: Design System Colors',
  render: () => (
    <div>
      <p>✅ Use only design system colors:</p>
      <div>
        <button>Fixed: Using amber from design system</button>
        <button>Fixed: Using blue from design system</button>
        <button>Fixed: Using blue from design system</button>
      </div>
      <p>✅ Instead, use ActionButtonGroup with design system variants:</p>
      <ActionButtonGroup
        actions={[
          { label: 'Primary Action', onClick: () => {}, variant: 'primary' },
          {
            label: 'Secondary Action',
            onClick: () => {},
            variant: 'secondary',
          },
          { label: 'Success Action', onClick: () => {}, variant: 'success' },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '❌ **Anti-pattern**: Never use hardcoded colors like orange, purple, indigo that are not in the design system. Always use ActionButtonGroup with proper variants.',
      },
    },
  },
};

export const IncorrectButtonOrdering: Story = {
  name: '❌ Wrong: Poor Button Ordering',
  render: () => (
    <div>
      <p>❌ Poor ordering - goal action first, setup actions scattered:</p>
      <ActionButtonGroup
        actions={[
          {
            label: 'Play Game',
            onClick: () => {},
            variant: 'success',
            icon: <Play aria-hidden="true" />,
          }, // Goal action first (wrong)
          {
            label: 'Edit Settings',
            onClick: () => {},
            variant: 'secondary',
            icon: <Pencil aria-hidden="true" />,
          },
          {
            label: 'Make Active',
            onClick: () => {},
            variant: 'secondary',
            icon: <CheckCircle aria-hidden="true" />,
          }, // Setup action in middle (confusing)
          {
            label: 'View Details',
            onClick: () => {},
            variant: 'primary',
            icon: <Eye aria-hidden="true" />,
          },
        ]}
      />
      <p>✅ Better ordering - setup first, goal action last:</p>
      <ActionButtonGroup
        actions={[
          {
            label: 'Make Active',
            onClick: () => {},
            variant: 'secondary',
            icon: <CheckCircle aria-hidden="true" />,
          }, // Setup first
          {
            label: 'View Details',
            onClick: () => {},
            variant: 'primary',
            icon: <Eye aria-hidden="true" />,
          }, // Content management
          {
            label: 'Edit Settings',
            onClick: () => {},
            variant: 'secondary',
            icon: <Pencil aria-hidden="true" />,
          }, // Secondary actions
          {
            label: 'Play Game',
            onClick: () => {},
            variant: 'success',
            icon: <Play aria-hidden="true" />,
          }, // Goal action last (prominent)
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '❌ **Anti-pattern**: Poor button ordering puts the main goal action first or scatters setup actions. This creates cognitive overhead for users.',
      },
    },
  },
};

// Quick reference for developers
export const QuickReference: Story = {
  name: '📚 Quick Reference',
  render: () => (
    <div>
      <div>
        <h3>Button Variant Colors</h3>
        <div>
          <div>
            <strong>primary:</strong> <span>Blue</span> - Main actions, content
            management
          </div>
          <div>
            <strong>secondary:</strong> <span>Gray</span> - Supporting actions,
            neutral choices
          </div>
          <div>
            <strong>success:</strong> <span>Green</span> - Goal actions,
            positive outcomes
          </div>
          <div>
            <strong>danger:</strong> <span>Red</span> - Destructive actions,
            delete operations
          </div>
        </div>
      </div>

      <div>
        <h3>Button Ordering Priority</h3>
        <ol>
          <li>
            <strong>Context/Setup actions</strong> (Make Active, Select World)
          </li>
          <li>
            <strong>Content management</strong> (Create, Edit, View, Manage)
          </li>
          <li>
            <strong>Secondary actions</strong> (Import, Export, Settings)
          </li>
          <li>
            <strong>Goal actions</strong> (Play, Start, Begin) -{' '}
            <em>always last for emphasis</em>
          </li>
        </ol>
      </div>

      <div>
        <h3>Implementation Checklist</h3>
        <div>
          <ul>
            <li>
              ✅ Use <code>ActionButtonGroup</code> instead of individual
              buttons
            </li>
            <li>
              ✅ Use semantic variants (<code>primary</code>,{' '}
              <code>secondary</code>, <code>success</code>, <code>danger</code>)
            </li>
            <li>✅ Order buttons by user workflow priority</li>
            <li>
              ✅ Put goal actions (Play, Start) last with <code>success</code>{' '}
              variant
            </li>
            <li>
              ✅ Validate colors are in{' '}
              <code>/docs/design-system/design-tokens.md</code>
            </li>
            <li>❌ Never use hardcoded colors outside design system</li>
            <li>❌ Never put goal actions first in button groups</li>
          </ul>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '📚 **Developer Reference**: Quick guidelines for implementing consistent button styling across the application.',
      },
    },
  },
};
