import type { Meta, StoryObj } from '@storybook/react';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { Eye, Pencil } from 'lucide-react';
import { CardActionGroup } from '@/components/shared/cards/CardActionGroup';

const meta: Meta<typeof ActionButtonGroup> = {
  title: '06-Patterns/ui-patterns/Button Sizes',
  component: ActionButtonGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Button size variants and examples for different contexts including small secondary actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonSizeComparison: Story = {
  render: () => (
    <div>
      <div>
        <h3>ActionButtonGroup Sizes</h3>
        <div>
          <div>
            <span>Small:</span>
            <ActionButtonGroup
              actions={[
                {
                  label: 'View',
                  onClick: () => {},
                  variant: 'secondary',
                  size: 'sm',
                  icon: <Eye aria-hidden="true" />,
                },
              ]}
            />
            <code>size=&quot;sm&quot;</code>
          </div>
          <div>
            <span>Default:</span>
            <ActionButtonGroup
              actions={[
                {
                  label: 'View',
                  onClick: () => {},
                  variant: 'secondary',
                  size: 'default',
                  icon: <Eye aria-hidden="true" />,
                },
              ]}
            />
            <code>size=&quot;default&quot;</code>
          </div>
          <div>
            <span>Large:</span>
            <ActionButtonGroup
              actions={[
                {
                  label: 'View',
                  onClick: () => {},
                  variant: 'secondary',
                  size: 'lg',
                  icon: <Eye aria-hidden="true" />,
                },
              ]}
            />
            <code>size=&quot;lg&quot;</code>
          </div>
        </div>
      </div>

      <div>
        <h3>CardActionGroup Small Secondary Actions</h3>
        <div>
          <div>
            <h4>Sample Card</h4>
            <p>This shows how small buttons appear in card contexts</p>
          </div>
          <CardActionGroup
            secondaryActions={[
              {
                key: 'view',
                text: 'View',
                onClick: () => {},
                variant: 'secondary',
                icon: <Eye aria-hidden="true" />,
              },
              {
                key: 'edit',
                text: 'Edit',
                onClick: () => {},
                variant: 'secondary',
                icon: <Pencil aria-hidden="true" />,
              },
              {
                key: 'delete',
                text: 'Delete',
                onClick: () => {},
                variant: 'danger',
              },
            ]}
            secondarySize="sm"
          />
          <p>
            Secondary actions use <code>px-2 py-1 text-xs</code> sizing
          </p>
        </div>
      </div>

      <div>
        <h4>Size Usage Guidelines</h4>
        <ul>
          <li>
            <strong>Small (sm):</strong> Secondary actions in cards, inline
            controls, compact layouts
          </li>
          <li>
            <strong>Default:</strong> Standard page actions, primary navigation
            buttons
          </li>
          <li>
            <strong>Large (lg):</strong> Call-to-action buttons, hero sections,
            prominent actions
          </li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comparison of button sizes across ActionButtonGroup and CardActionGroup components. Small buttons (like the example you provided) are commonly used for secondary actions in card layouts.',
      },
    },
  },
};
