import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  WizardFormFieldSimple,
  WizardInputSimple,
  WizardTextareaSimple,
} from './WizardFormComponentsSimple';

const meta: Meta<typeof WizardFormFieldSimple> = {
  title: 'Narraitor/Patterns/Forms/WizardFormComponentsSimple',
  component: WizardFormFieldSimple,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Simple wizard form components without react-hook-form dependencies for basic use cases.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;


function DefaultStory() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">Simple Form Demo</h2>
      
      <WizardFormFieldSimple
        name="name"
        label="Name"
        description="Enter a unique name"
        required
      >
        <WizardInputSimple placeholder="Enter name" />
      </WizardFormFieldSimple>
      
      <WizardFormFieldSimple
        name="description"
        label="Description"
        description="Provide a detailed description"
      >
        <WizardTextareaSimple placeholder="Enter description" />
      </WizardFormFieldSimple>
      
      <WizardFormFieldSimple
        name="theme"
        label="Theme"
        description="Choose a theme"
      >
        <WizardInputSimple placeholder="Enter theme" />
      </WizardFormFieldSimple>
      
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
        <strong>Note:</strong> These are stateless components for display purposes only.
      </div>
    </div>
  );
}

export const Default: Story = {
  render: DefaultStory,
};

export const WithErrors: Story = {
  render: () => (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">Form with Errors</h2>
      
      <WizardFormFieldSimple
        name="name"
        label="Name"
        description="Enter a unique name"
        required
        error="Name is required"
      >
        <WizardInputSimple placeholder="Enter name" />
      </WizardFormFieldSimple>
      
      <WizardFormFieldSimple
        name="description"
        label="Description"
        description="Provide a detailed description"
        error="Description must be at least 10 characters"
      >
        <WizardTextareaSimple placeholder="Enter description" />
      </WizardFormFieldSimple>
    </div>
  ),
};