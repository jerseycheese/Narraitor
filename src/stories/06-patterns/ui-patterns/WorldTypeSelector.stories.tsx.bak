import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { WorldTypeSelector, WorldTypeData, createInitialWorldTypeData } from '@/components/shared/WorldTypeSelector';

const meta: Meta<typeof WorldTypeSelector> = {
  title: '06-Patterns/ui-patterns/WorldTypeSelector',
  component: WorldTypeSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A reusable component for selecting world types (Original, Inspired By, Set Within) with dynamic validation and conditional fields. Used across all world creation entry points for consistency.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      description: 'Current world type data',
      control: false,
    },
    onChange: {
      description: 'Callback fired when data changes',
      action: 'onChange',
    },
    showLabels: {
      description: 'Whether to show the "World Type" label',
      control: 'boolean',
    },
    layout: {
      description: 'Layout direction for radio buttons',
      control: 'radio',
      options: ['vertical', 'horizontal'],
    },
    size: {
      description: 'Size variant',
      control: 'radio',
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      description: 'Whether the component is disabled',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper component
const InteractiveWorldTypeSelector = (args: Record<string, unknown>) => {
  const [data, setData] = useState<WorldTypeData>(createInitialWorldTypeData());

  return (
    <div className="space-y-4">
      <WorldTypeSelector
        {...args}
        value={data}
        onChange={setData}
      />
      
      {/* Debug output */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Current Data:</h3>
        <pre className="text-sm text-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <InteractiveWorldTypeSelector {...args} />,
  args: {
    showLabels: true,
    layout: 'vertical',
    size: 'medium',
    disabled: false,
  },
};

export const Small: Story = {
  render: (args) => <InteractiveWorldTypeSelector {...args} />,
  args: {
    ...Default.args,
    size: 'small',
  },
};

export const Large: Story = {
  render: (args) => <InteractiveWorldTypeSelector {...args} />,
  args: {
    ...Default.args,
    size: 'large',
  },
};

export const HorizontalLayout: Story = {
  render: (args) => <InteractiveWorldTypeSelector {...args} />,
  args: {
    ...Default.args,
    layout: 'horizontal',
  },
};

export const WithoutLabels: Story = {
  render: (args) => <InteractiveWorldTypeSelector {...args} />,
  args: {
    ...Default.args,
    showLabels: false,
  },
};

export const Disabled: Story = {
  render: (args) => <InteractiveWorldTypeSelector {...args} />,
  args: {
    ...Default.args,
    disabled: true,
  },
};

// Pre-filled examples
const InspiredByExampleComponent = () => {
  const [data, setData] = useState<WorldTypeData>({
    worldType: 'inspired_by',
    worldReference: 'Star Wars',
    additionalDetails: 'Focus on smugglers and bounty hunters in the outer rim',
  });

  return (
    <div className="space-y-4">
      <WorldTypeSelector
        value={data}
        onChange={setData}
        size="medium"
      />
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Current Data:</h3>
        <pre className="text-sm text-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const InspiredByExample: Story = {
  render: () => <InspiredByExampleComponent />,
  parameters: {
    docs: {
      description: {
        story: 'Example showing a world inspired by Star Wars with additional context about smugglers and bounty hunters.',
      },
    },
  },
};

const SetWithinExampleComponent = () => {
  const [data, setData] = useState<WorldTypeData>({
    worldType: 'set_within',
    worldReference: 'Washington DC',
    additionalDetails: 'The day of Abraham Lincoln\'s assassination',
  });

  return (
    <div className="space-y-4">
      <WorldTypeSelector
        value={data}
        onChange={setData}
        size="medium"
      />
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Current Data:</h3>
        <pre className="text-sm text-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const SetWithinExample: Story = {
  render: () => <SetWithinExampleComponent />,
  parameters: {
    docs: {
      description: {
        story: 'Example showing a world set within historical Washington DC on a specific date.',
      },
    },
  },
};