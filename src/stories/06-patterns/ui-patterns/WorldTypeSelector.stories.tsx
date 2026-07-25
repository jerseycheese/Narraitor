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
    <div>
      <WorldTypeSelector
        {...args}
        value={data}
        onChange={setData}
      />
      
      {/* Debug output */}
      <div>
        <h3>Current Data:</h3>
        <pre>
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
    disabled: false,
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
    <div>
      <WorldTypeSelector
        value={data}
        onChange={setData}
      />

      <div>
        <h3>Current Data:</h3>
        <pre>
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
    <div>
      <WorldTypeSelector
        value={data}
        onChange={setData}
      />

      <div>
        <h3>Current Data:</h3>
        <pre>
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