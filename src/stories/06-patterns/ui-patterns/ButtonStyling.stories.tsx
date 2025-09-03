import type { Meta, StoryObj } from '@storybook/react';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { CardActionGroup } from '@/components/shared/cards/CardActionGroup';

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
 * - Size: `w-4 h-4` for default buttons, `w-6 h-6` for large buttons
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
        component: 'Design system compliant button patterns and styling guidelines for consistent UI.'
      }
    }
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
        variant: 'secondary' // Gray - neutral context action
      },
      {
        label: 'View Characters', 
        onClick: () => console.log('View Characters clicked'),
        variant: 'primary' // Blue - content management
      },
      {
        label: 'Edit World',
        onClick: () => console.log('Edit World clicked'), 
        variant: 'secondary' // Gray - supporting action
      },
      {
        label: 'Play in World',
        onClick: () => console.log('Play clicked'),
        variant: 'success', // Green - primary goal action (last)
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    ]
  },
  parameters: {
    docs: {
      description: {
        story: '✅ **Correct Example**: World detail page buttons with proper ordering and colors. Goal action (Play) comes last with green success styling.'
      }
    }
  }
};

export const CharacterPageButtons: Story = {
  args: {
    actions: [
      {
        label: 'Create Character',
        onClick: () => console.log('Create clicked'),
        variant: 'primary', // Blue - main content action
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
      },
      {
        label: 'Generate Character',
        onClick: () => console.log('Generate clicked'),
        variant: 'secondary', // Gray - alternative creation method  
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      },
      {
        label: 'Start Playing',
        onClick: () => console.log('Play clicked'),
        variant: 'success', // Green - primary goal action (last)
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    ]
  },
  parameters: {
    docs: {
      description: {
        story: '✅ **Correct Example**: Character page buttons with proper ordering. Content actions first, then primary goal (Start Playing) last.'
      }
    }
  }
};

export const DestructiveActionPattern: Story = {
  args: {
    actions: [
      {
        label: 'Cancel',
        onClick: () => console.log('Cancel clicked'),
        variant: 'secondary' // Gray - neutral action
      },
      {
        label: 'Delete World',
        onClick: () => console.log('Delete clicked'),
        variant: 'danger' // Red - destructive action
      }
    ]
  },
  parameters: {
    docs: {
      description: {
        story: '✅ **Correct Example**: Destructive actions use red `danger` variant and come after neutral actions.'
      }
    }
  }
};

// Anti-patterns to avoid
export const IncorrectHardcodedColors: Story = {
  name: '❌ Wrong: Hardcoded Colors',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-red-600 font-medium mb-4">❌ Don't use hardcoded colors outside the design system:</p>
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-700">
          Wrong: Orange not in design system
        </button>
        <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-700">
          Wrong: Purple not in design system  
        </button>
        <button className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-700">
          Wrong: Indigo not in design system
        </button>
      </div>
      <p className="text-sm text-green-600 font-medium mt-4">✅ Instead, use ActionButtonGroup with design system variants:</p>
      <ActionButtonGroup
        actions={[
          { label: 'Primary Action', onClick: () => {}, variant: 'primary' },
          { label: 'Secondary Action', onClick: () => {}, variant: 'secondary' },
          { label: 'Success Action', onClick: () => {}, variant: 'success' }
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '❌ **Anti-pattern**: Never use hardcoded colors like orange, purple, indigo that are not in the design system. Always use ActionButtonGroup with proper variants.'
      }
    }
  }
};

export const IncorrectButtonOrdering: Story = {
  name: '❌ Wrong: Poor Button Ordering',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-red-600 font-medium mb-4">❌ Poor ordering - goal action first, setup actions scattered:</p>
      <ActionButtonGroup
        actions={[
          { 
            label: 'Play Game', 
            onClick: () => {}, 
            variant: 'success',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          }, // Goal action first (wrong)
          { 
            label: 'Edit Settings', 
            onClick: () => {}, 
            variant: 'secondary',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )
          },
          { 
            label: 'Make Active', 
            onClick: () => {}, 
            variant: 'secondary',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          }, // Setup action in middle (confusing)
          { 
            label: 'View Details', 
            onClick: () => {}, 
            variant: 'primary',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )
          }
        ]}
      />
      <p className="text-sm text-green-600 font-medium mt-4">✅ Better ordering - setup first, goal action last:</p>
      <ActionButtonGroup
        actions={[
          { 
            label: 'Make Active', 
            onClick: () => {}, 
            variant: 'secondary',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          }, // Setup first
          { 
            label: 'View Details', 
            onClick: () => {}, 
            variant: 'primary',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )
          }, // Content management
          { 
            label: 'Edit Settings', 
            onClick: () => {}, 
            variant: 'secondary',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )
          }, // Secondary actions
          { 
            label: 'Play Game', 
            onClick: () => {}, 
            variant: 'success',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          } // Goal action last (prominent)
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '❌ **Anti-pattern**: Poor button ordering puts the main goal action first or scatters setup actions. This creates cognitive overhead for users.'
      }
    }
  }
};

// Quick reference for developers
export const QuickReference: Story = {
  name: '📚 Quick Reference',
  render: () => (
    <div className="max-w-4xl space-y-6 text-left">
      <div>
        <h3 className="text-lg font-semibold mb-3">Button Variant Colors</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>primary:</strong> <span className="text-blue-700">Blue</span> - Main actions, content management
          </div>
          <div>
            <strong>secondary:</strong> <span className="text-gray-700">Gray</span> - Supporting actions, neutral choices
          </div>
          <div>
            <strong>success:</strong> <span className="text-green-700">Green</span> - Goal actions, positive outcomes
          </div>
          <div>
            <strong>danger:</strong> <span className="text-red-700">Red</span> - Destructive actions, delete operations
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Button Ordering Priority</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><strong>Context/Setup actions</strong> (Make Active, Select World)</li>
          <li><strong>Content management</strong> (Create, Edit, View, Manage)</li>
          <li><strong>Secondary actions</strong> (Import, Export, Settings)</li>
          <li><strong>Goal actions</strong> (Play, Start, Begin) - <em>always last for emphasis</em></li>
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Implementation Checklist</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ul className="space-y-2 text-sm">
            <li>✅ Use <code>ActionButtonGroup</code> instead of individual buttons</li>
            <li>✅ Use semantic variants (<code>primary</code>, <code>secondary</code>, <code>success</code>, <code>danger</code>)</li>
            <li>✅ Order buttons by user workflow priority</li>
            <li>✅ Put goal actions (Play, Start) last with <code>success</code> variant</li>
            <li>✅ Validate colors are in <code>/docs/design-system/design-tokens.md</code></li>
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
        story: '📚 **Developer Reference**: Quick guidelines for implementing consistent button styling across the application.'
      }
    }
  }
};