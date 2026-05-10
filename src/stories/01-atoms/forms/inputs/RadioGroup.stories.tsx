import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const meta: Meta<typeof RadioGroup> = {
  title: '01-Atoms/forms/inputs/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Component for Default story
const DefaultComponent = (args: React.ComponentProps<typeof RadioGroup>) => {
  const [value, setValue] = useState('option1');
  
  return (
    <RadioGroup
      {...args}
      value={value}
      onValueChange={setValue}
      name="default-radio"
    >
      <RadioGroupItem value="option1">Option 1</RadioGroupItem>
      <RadioGroupItem value="option2">Option 2</RadioGroupItem>
      <RadioGroupItem value="option3">Option 3</RadioGroupItem>
    </RadioGroup>
  );
};

export const Default: Story = {
  render: DefaultComponent,
};

// Component for Horizontal story
const HorizontalComponent = (args: React.ComponentProps<typeof RadioGroup>) => {
  const [value, setValue] = useState('option1');
  
  return (
    <RadioGroup
      {...args}
      value={value}
      onValueChange={setValue}
      name="horizontal-radio"
      orientation="horizontal"
    >
      <RadioGroupItem value="option1">Option 1</RadioGroupItem>
      <RadioGroupItem value="option2">Option 2</RadioGroupItem>
      <RadioGroupItem value="option3">Option 3</RadioGroupItem>
    </RadioGroup>
  );
};

export const Horizontal: Story = {
  render: HorizontalComponent,
};

// Component for Disabled story
const DisabledComponent = (args: React.ComponentProps<typeof RadioGroup>) => {
  const [value, setValue] = useState('option2');
  
  return (
    <RadioGroup
      {...args}
      value={value}
      onValueChange={setValue}
      name="disabled-radio"
      disabled
    >
      <RadioGroupItem value="option1">Option 1</RadioGroupItem>
      <RadioGroupItem value="option2">Option 2 (Selected)</RadioGroupItem>
      <RadioGroupItem value="option3">Option 3</RadioGroupItem>
    </RadioGroup>
  );
};

export const Disabled: Story = {
  render: DisabledComponent,
};

// Component for World Type Example story
const WorldTypeExampleComponent = (args: React.ComponentProps<typeof RadioGroup>) => {
  const [value, setValue] = useState('original');
  
  return (
    <div>
      <label>
        World Type <span>*</span>
      </label>
      <RadioGroup
        {...args}
        value={value}
        onValueChange={setValue}
        name="world-type-radio"
      >
        <div>
          <RadioGroupItem value="original" />
          <div>
            <div>Original World</div>
            <div>
              Generate a completely original world with unique settings and themes
            </div>
          </div>
        </div>
        <div>
          <RadioGroupItem value="inspired_by" />
          <div>
            <div>Inspired By</div>
            <div>
              Generate an original world inspired by an existing fictional universe
            </div>
          </div>
        </div>
        <div>
          <RadioGroupItem value="set_within" />
          <div>
            <div>Set Within</div>
            <div>
              Generate a world directly within an existing fictional universe
            </div>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};

export const WorldTypeExample: Story = {
  render: WorldTypeExampleComponent,
};

// Component for Simple Options story
const SimpleOptionsComponent = (args: React.ComponentProps<typeof RadioGroup>) => {
  const [value, setValue] = useState('medium');
  
  return (
    <RadioGroup
      {...args}
      value={value}
      onValueChange={setValue}
      name="simple-radio"
    >
      <RadioGroupItem value="small">Small</RadioGroupItem>
      <RadioGroupItem value="medium">Medium</RadioGroupItem>
      <RadioGroupItem value="large">Large</RadioGroupItem>
    </RadioGroup>
  );
};

export const SimpleOptions: Story = {
  render: SimpleOptionsComponent,
};