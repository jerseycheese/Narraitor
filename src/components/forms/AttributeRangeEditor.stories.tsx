import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import AttributeRangeEditor from './AttributeRangeEditor';
import { WorldAttribute } from '@/types/world.types';

const meta: Meta<typeof AttributeRangeEditor> = {
  title: 'Narraitor/UI/Forms/AttributeRangeEditor',
  component: AttributeRangeEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    attribute: {
      control: 'object',
    },
    onChange: { action: 'changed' },
    disabled: {
      control: 'boolean',
    },
    showLabels: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AttributeRangeEditor>;

const defaultAttribute: WorldAttribute = {
  id: 'attr-1',
  worldId: 'world-123',
  name: 'Strength',
  description: 'Physical power and capability',
  baseValue: 5,
  minValue: 1,
  maxValue: 10,
};

export const Default: Story = {
  args: {
    attribute: defaultAttribute,
    showLabels: true,
  },
};

export const WithHighValue: Story = {
  args: {
    attribute: {
      ...defaultAttribute,
      baseValue: 9,
    },
    showLabels: true,
  },
};

export const WithLowValue: Story = {
  args: {
    attribute: {
      ...defaultAttribute,
      baseValue: 2,
    },
    showLabels: true,
  },
};

export const Disabled: Story = {
  args: {
    attribute: defaultAttribute,
    disabled: true,
    showLabels: true,
  },
};

export const InContextExample: Story = {
  render: () => {
    const attributes: WorldAttribute[] = [
      {
        id: 'attr-1',
        worldId: 'world-123',
        name: 'Strength',
        description: 'Physical power',
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
      },
      {
        id: 'attr-2',
        worldId: 'world-123',
        name: 'Intelligence',
        description: 'Mental acuity',
        baseValue: 8,
        minValue: 1,
        maxValue: 10,
      },
      {
        id: 'attr-3',
        worldId: 'world-123',
        name: 'Dexterity',
        description: 'Speed and coordination',
        baseValue: 3,
        minValue: 1,
        maxValue: 10,
      },
    ];

    return (
      <div className="p-4 max-w-md border rounded">
        <h2 className="text-xl font-bold mb-4">Character Attributes</h2>
        <div className="space-y-6">
          {attributes.map((attribute, index) => (
            <div key={index} className="p-3 border rounded">
              <h3 className="font-medium mb-2">{attribute.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{attribute.description}</p>
              <AttributeRangeEditor
                attribute={attribute}
                onChange={(updates) => action('updated')(`Attribute: ${attribute.name}`, updates)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  },
};