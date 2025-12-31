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
        component: 'Button size variants and examples for different contexts including small secondary actions.'
      }
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonSizeComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">ActionButtonGroup Sizes</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-16 text-sm text-gray-600">Small:</span>
            <ActionButtonGroup 
              actions={[{
                label: 'View',
                onClick: () => {},
                variant: 'secondary',
                size: 'sm',
                icon: (<Eye className="w-4 h-4" aria-hidden="true" />)
              }]}
            />
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">size=&quot;sm&quot;</code>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-16 text-sm text-gray-600">Default:</span>
            <ActionButtonGroup 
              actions={[{
                label: 'View',
                onClick: () => {},
                variant: 'secondary',
                size: 'default',
                icon: (<Eye className="w-4 h-4" aria-hidden="true" />)
              }]}
            />
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">size=&quot;default&quot;</code>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-16 text-sm text-gray-600">Large:</span>
            <ActionButtonGroup 
              actions={[{
                label: 'View',
                onClick: () => {},
                variant: 'secondary',
                size: 'lg',
                icon: (<Eye className="w-4 h-4" aria-hidden="true" />)
              }]}
            />
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">size=&quot;lg&quot;</code>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">CardActionGroup Small Secondary Actions</h3>
        <div className="max-w-sm border border-gray-200 rounded-lg p-4">
          <div className="mb-4">
            <h4 className="font-medium">Sample Card</h4>
            <p className="text-sm text-gray-600">This shows how small buttons appear in card contexts</p>
          </div>
          <CardActionGroup
            secondaryActions={[
              {
                key: 'view',
                text: 'View',
                onClick: () => {},
                variant: 'secondary',
                icon: (<Eye className="w-4 h-4" aria-hidden="true" />)
              },
              {
                key: 'edit',
                text: 'Edit',
                onClick: () => {},
                variant: 'secondary',
                icon: (<Pencil className="w-4 h-4" aria-hidden="true" />)
              },
              {
                key: 'delete',
                text: 'Delete',
                onClick: () => {},
                variant: 'danger'
              }
            ]}
            secondarySize="sm"
          />
          <p className="text-xs text-gray-500 mt-3">
            Secondary actions use <code>px-2 py-1 text-xs</code> sizing
          </p>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Size Usage Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Small (sm):</strong> Secondary actions in cards, inline controls, compact layouts</li>
          <li><strong>Default:</strong> Standard page actions, primary navigation buttons</li>  
          <li><strong>Large (lg):</strong> Call-to-action buttons, hero sections, prominent actions</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of button sizes across ActionButtonGroup and CardActionGroup components. Small buttons (like the example you provided) are commonly used for secondary actions in card layouts.'
      }
    }
  }
};
