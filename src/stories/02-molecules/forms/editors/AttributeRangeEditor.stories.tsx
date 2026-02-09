import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import AttributeRangeEditor from '@/components/forms/AttributeRangeEditor';
import { WorldAttribute } from '@/types/world.types';

const meta: Meta<typeof AttributeRangeEditor> = {
  title: '02-Molecules/forms/editors/AttributeRangeEditor',
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


export const Disabled: Story = {
  args: {
    attribute: defaultAttribute,
    disabled: true,
    showLabels: true,
  },
};

export const InteractiveExample: Story = {
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
      <div >
        <h2 >Character Attributes</h2>
        <div >
          {attributes.map((attribute, index) => (
            <div key={index} >
              <h3 >{attribute.name}</h3>
              <p >{attribute.description}</p>
              <AttributeRangeEditor
                attribute={attribute}
                onChange={(updates) => action('updated')(`Attribute:${attribute.name}`, updates)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  },
};
