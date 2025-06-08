import type { Meta, StoryObj } from '@storybook/react';
import { DataField } from './DataField';

const meta: Meta<typeof DataField> = {
  title: 'Narraitor/UI/Controls/DataField',
  component: DataField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['default', 'inline', 'stacked'],
    },
    size: {
      control: { type: 'radio' },
      options: ['sm', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'World',
    value: 'Fantasy Realm',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3">Default</h3>
        <DataField label="Character" value="Aragorn the Ranger" />
      </div>
      <div>
        <h3 className="font-medium mb-3">Inline</h3>
        <DataField label="Progress" value="15 entries" variant="inline" />
      </div>
      <div>
        <h3 className="font-medium mb-3">Stacked</h3>
        <DataField 
          label="Description" 
          value="A vast magical world filled with ancient mysteries and dangerous creatures." 
          variant="stacked" 
        />
      </div>
    </div>
  ),
};

export const QuickPlayExample: Story = {
  render: () => (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-500 max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Pick Up Where You Left Off
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <DataField label="World" value="Mystic Realm" />
        <DataField label="Character" value="Elara Moonshadow" />
      </div>
      <DataField 
        label="Progress" 
        value="23 entries"
        variant="inline"
      />
    </div>
  ),
};
