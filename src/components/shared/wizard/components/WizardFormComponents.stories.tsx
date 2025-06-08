import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WizardForm } from './WizardForm';
import {
  WizardFormField,
  WizardInput,
  WizardTextarea,
  WizardSelect,
} from './WizardFormComponents';

const meta: Meta<typeof WizardForm> = {
  title: 'Narraitor/Shared/Patterns/WizardFormComponents',
  component: WizardForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'React Hook Form integrated wizard form components with shadcn/ui styling and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

interface DemoFormData {
  name: string;
  description: string;
  theme: string;
  difficulty: string;
}

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

function DefaultStory() {
  const [formData] = useState<DemoFormData>({
    name: '',
    description: '',
    theme: '',
    difficulty: '',
  });


  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Demo Form</h2>
      <WizardForm data={formData}>
        <WizardFormField
          name="name"
          label="Name"
          description="Enter a unique name"
          required
        >
          <WizardInput placeholder="Enter name" />
        </WizardFormField>
        
        <WizardFormField
          name="description"
          label="Description"
          description="Provide a detailed description"
        >
          <WizardTextarea placeholder="Enter description" />
        </WizardFormField>
        
        <WizardFormField
          name="theme"
          label="Theme"
          description="Choose a theme"
        >
          <WizardInput placeholder="Enter theme" />
        </WizardFormField>
        
        <WizardFormField
          name="difficulty"
          label="Difficulty"
          description="Select difficulty level"
        >
          <WizardSelect options={difficultyOptions} placeholder="Select difficulty" />
        </WizardFormField>
      </WizardForm>
      
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
        <strong>Form Data:</strong>
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: DefaultStory,
};

function ValidationStory() {
  const [formData] = useState<DemoFormData>({
    name: 'A',
    description: 'Short',
    theme: '',
    difficulty: '',
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Form with Validation</h2>
      <WizardForm data={formData}>
        <WizardFormField
          name="name"
          label="Name"
          description="Name must be at least 3 characters"
          required
        >
          <WizardInput placeholder="Enter name" />
        </WizardFormField>
        
        <WizardFormField
          name="description"
          label="Description"
          description="Description must be at least 10 characters"
        >
          <WizardTextarea placeholder="Enter description" />
        </WizardFormField>
      </WizardForm>
    </div>
  );
}

export const WithValidation: Story = {
  render: ValidationStory,
};

function PrefilledStory() {
  const [formData] = useState<DemoFormData>({
    name: 'Sample World',
    description: 'A mystical realm filled with ancient magic and forgotten secrets.',
    theme: 'Fantasy',
    difficulty: 'medium',
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Prefilled Form</h2>
      <WizardForm data={formData}>
        <WizardFormField
          name="name"
          label="Name"
          required
        >
          <WizardInput placeholder="Enter name" />
        </WizardFormField>
        
        <WizardFormField
          name="description"
          label="Description"
        >
          <WizardTextarea placeholder="Enter description" />
        </WizardFormField>
        
        <WizardFormField
          name="theme"
          label="Theme"
        >
          <WizardInput placeholder="Enter theme" />
        </WizardFormField>
        
        <WizardFormField
          name="difficulty"
          label="Difficulty"
        >
          <WizardSelect options={difficultyOptions} placeholder="Select difficulty" />
        </WizardFormField>
      </WizardForm>
    </div>
  );
}

export const Prefilled: Story = {
  render: PrefilledStory,
};