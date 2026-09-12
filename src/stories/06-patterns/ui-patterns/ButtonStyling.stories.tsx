import type { Meta, StoryObj } from '@storybook/react';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { Plus, Play, Pencil } from 'lucide-react';

/**
 * # Button Styling Guidelines & Patterns
 *
 * Documents consistent button styling patterns and the one-primary-per-state rule.
 *
 * ## Design System Colors Only
 *
 * All buttons must use colors from the design token system:
 * - **Ink Blue** (`default`/`primary`): the one filled primary CTA per rendered state
 * - **Surface-hover** (`secondary`): supporting/neutral actions
 * - **Outline** (`outline`): shell navigation shortcuts that don't own the page action
 * - **Green** (`success`): confirmed completion/success states only — never Play, Continue, Create
 * - **Red** (`destructive`, `destructive-outline`): destructive actions
 *
 * ## Semantic Button Variants
 *
 * - **default / primary**: The single filled ink-blue task-advancing CTA for this rendered state
 * - **secondary**: Supporting actions (Make Active, Edit, View, Cancel)
 * - **outline**: Shell shortcuts that sit above the page (header Play); the real primary is on the page
 * - **success**: Confirmed completion only (e.g. "Story Saved", confirmation dialogs)
 * - **destructive-outline**: Quiet destructive action (Delete Character)
 *
 * ## One Primary Per Rendered State
 *
 * Each distinct rendered state has exactly one filled ink-blue button.
 * All competing actions are secondary, outline, or absent.
 *
 * Examples:
 * - Worlds list: page-level **Create** is primary; per-card **Play** is secondary
 * - World detail: **Play in World** is primary; **Edit** is secondary
 * - Ending screen: **New Story** is primary; **Back to Worlds** is secondary
 * - Header: Play is **outline** — the page below owns the real primary
 *
 * ## Button Ordering
 *
 * Order by user workflow:
 * 1. Context/Setup (Make Active)
 * 2. Content management (Edit, View)
 * 3. Task-advancing primary last (Play, Create) — gets the most emphasis
 */

const meta: Meta<typeof ActionButtonGroup> = {
  title: '06-Patterns/ui-patterns/Button Styling Guidelines',
  component: ActionButtonGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Design system compliant button patterns and the one-primary-per-state rule.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActionButtonGroup>;

export const WorldDetailPageButtons: Story = {
  args: {
    actions: [
      {
        label: 'Make Active',
        onClick: () => console.log('Make Active clicked'),
        variant: 'secondary',
      },
      {
        label: 'View Characters',
        onClick: () => console.log('View Characters clicked'),
        variant: 'secondary',
      },
      {
        label: 'Edit World',
        onClick: () => console.log('Edit World clicked'),
        variant: 'secondary',
      },
      {
        label: 'Play in World',
        onClick: () => console.log('Play clicked'),
        variant: 'primary',
        icon: <Play aria-hidden="true" />,
        flex: true,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          '**World detail page**: Play in World is the single primary CTA. Edit and supporting actions are secondary.',
      },
    },
  },
};

export const CharacterPageButtons: Story = {
  args: {
    actions: [
      {
        label: 'Edit Character',
        onClick: () => console.log('Edit clicked'),
        variant: 'secondary',
        icon: <Pencil aria-hidden="true" />,
      },
      {
        label: 'Play with Character',
        onClick: () => console.log('Play clicked'),
        variant: 'primary',
        icon: <Play aria-hidden="true" />,
        flex: true,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Character detail page**: Play with Character is the single primary CTA. Edit is secondary.',
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
        variant: 'secondary',
      },
      {
        label: 'Delete World',
        onClick: () => console.log('Delete clicked'),
        variant: 'danger',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Destructive actions** use `danger` or `danger-outline`. Cancel is secondary.',
      },
    },
  },
};

export const WrongTwoFilledPrimaries: Story = {
  name: 'Wrong: Two competing primaries',
  render: () => (
    <div>
      <p>Never render two filled primary (ink-blue) buttons at once:</p>
      <ActionButtonGroup
        actions={[
          {
            label: 'Create World',
            onClick: () => {},
            variant: 'primary',
            icon: <Plus aria-hidden="true" />,
          },
          {
            label: 'Play',
            onClick: () => {},
            variant: 'primary',
            icon: <Play aria-hidden="true" />,
          },
        ]}
      />
      <p>Fix: demote card-level Play to secondary; page Create stays primary.</p>
      <ActionButtonGroup
        actions={[
          {
            label: 'Play',
            onClick: () => {},
            variant: 'secondary',
            icon: <Play aria-hidden="true" />,
          },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '**Anti-pattern**: Two filled primary buttons in the same rendered state.',
      },
    },
  },
};

export const WrongSuccessForPlayVerbs: Story = {
  name: 'Wrong: success variant for Play/Continue',
  render: () => (
    <div>
      <p>Never use the green success variant for task-advancing actions:</p>
      <ActionButtonGroup
        actions={[
          {
            label: 'Play (wrong — green)',
            onClick: () => {},
            variant: 'success',
            icon: <Play aria-hidden="true" />,
          },
        ]}
      />
      <p>Fix: Play is default (ink-blue) when it is the page primary.</p>
      <ActionButtonGroup
        actions={[
          {
            label: 'Play',
            onClick: () => {},
            variant: 'primary',
            icon: <Play aria-hidden="true" />,
            flex: true,
          },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '**Anti-pattern**: Using `success` (green) for Play, Continue, Create, or navigation. Green means confirmed completion only.',
      },
    },
  },
};

export const QuickReference: Story = {
  name: 'Quick Reference',
  render: () => (
    <div>
      <h3>One Primary Per Rendered State</h3>
      <p>
        Each distinct UI state (dashboard with session, worlds list, world detail,
        ending screen) has exactly one filled ink-blue button. All other actions are
        secondary, outline, or absent.
      </p>
      <h3>Variant Semantics</h3>
      <ul>
        <li><strong>default / primary:</strong> the one task-advancing primary for this state</li>
        <li><strong>secondary:</strong> supporting/neutral actions</li>
        <li><strong>outline:</strong> shell shortcuts (header Play) that sit above the page primary</li>
        <li><strong>success (green):</strong> confirmed completion/success states only</li>
        <li><strong>destructive-outline:</strong> quiet destructive (Delete Character)</li>
      </ul>
      <h3>Checklist</h3>
      <ul>
        <li>One ink-blue primary per rendered state</li>
        <li>success is never Play, Continue, Create, or navigation</li>
        <li>Header Play is outline</li>
        <li>Per-card Play is secondary on list pages</li>
        <li>Use ActionButtonGroup or CardActionGroup — never raw adjacent buttons</li>
      </ul>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Developer quick reference for the one-primary-per-state rule.',
      },
    },
  },
};
