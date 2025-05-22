import type { Meta, StoryObj } from '@storybook/react';
import { BasicInfoStep } from './BasicInfoStep';

const meta: Meta<typeof BasicInfoStep> = {
  title: 'Narraitor/Character/BasicInfoStep',
  component: BasicInfoStep,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultData = {
  currentStep: 0,
  worldId: 'world-1',
  characterData: {
    name: '',
    description: '',
    portraitPlaceholder: '',
    attributes: [],
    skills: [],
    background: {
      history: '',
      personality: '',
      goals: [],
      motivation: '',
    },
  },
  validation: {},
  pointPools: {
    attributes: { total: 20, spent: 0, remaining: 20 },
    skills: { total: 15, spent: 0, remaining: 15 },
  },
};

const mockWorldConfig = {
  id: 'world-1',
  name: 'Test World',
  description: 'A test world',
  theme: 'fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 12,
    attributePointPool: 20,
    skillPointPool: 15,
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

export const Empty: Story = {
  args: {
    data: defaultData,
    onUpdate: (updates) => console.log('Update:', updates),
    onValidation: (valid, errors) => console.log('Validation:', { valid, errors }),
    worldConfig: mockWorldConfig,
  },
};

export const WithData: Story = {
  args: {
    data: {
      ...defaultData,
      characterData: {
        ...defaultData.characterData,
        name: 'Aragorn Strider',
        description: 'A ranger from the North, skilled in sword and bow',
      },
    },
    onUpdate: (updates) => console.log('Update:', updates),
    onValidation: (valid, errors) => console.log('Validation:', { valid, errors }),
    worldConfig: mockWorldConfig,
  },
};

export const WithValidationError: Story = {
  args: {
    data: {
      ...defaultData,
      characterData: {
        ...defaultData.characterData,
        name: 'AB', // Too short
      },
      validation: {
        0: {
          valid: false,
          errors: ['Name must be at least 3 characters'],
          touched: true,
        },
      },
    },
    onUpdate: (updates) => console.log('Update:', updates),
    onValidation: (valid, errors) => console.log('Validation:', { valid, errors }),
    worldConfig: mockWorldConfig,
  },
};

export const WithLongName: Story = {
  args: {
    data: {
      ...defaultData,
      characterData: {
        ...defaultData.characterData,
        name: 'Maximilianus Meridius Decimus Commander of the Armies',
        description: 'Father to a murdered son, husband to a murdered wife',
      },
    },
    onUpdate: (updates) => console.log('Update:', updates),
    onValidation: (valid, errors) => console.log('Validation:', { valid, errors }),
    worldConfig: mockWorldConfig,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how the portrait placeholder handles long names by using initials.',
      },
    },
  },
};