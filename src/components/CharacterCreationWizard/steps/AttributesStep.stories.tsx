import type { Meta, StoryObj } from '@storybook/react';
import { AttributesStep } from './AttributesStep';
import { WizardContainer, WizardProgress } from '@/components/shared/wizard';

const meta: Meta<typeof AttributesStep> = {
  title: 'Narraitor/Character/Creation/AttributesStep',
  component: AttributesStep,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <WizardContainer title="Create Character in Storybook Test World">
          <WizardProgress 
            steps={[
              { id: 'basic-info', label: 'Basic Info' },
              { id: 'attributes', label: 'Attributes' },
              { id: 'skills', label: 'Skills' },
              { id: 'background', label: 'Background' },
              { id: 'portrait', label: 'Portrait' }
            ]} 
            currentStep={1} 
            className="mb-6"
          />
          <div className="p-6 bg-white rounded-lg shadow">
            <Story />
          </div>
        </WizardContainer>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultData = {
  currentStep: 1,
  worldId: 'world-1',
  characterData: {
    name: 'Elara Moonshadow',
    description: 'A skilled mage from the northern kingdoms',
    attributes: [
      {
        attributeId: 'strength',
        name: 'Strength',
        description: 'Physical power and melee damage',
        value: 8,
        minValue: 3,
        maxValue: 18,
      },
      {
        attributeId: 'intelligence',
        name: 'Intelligence',
        description: 'Magical power and spell effectiveness',
        value: 15,
        minValue: 3,
        maxValue: 18,
      },
      {
        attributeId: 'dexterity',
        name: 'Dexterity',
        description: 'Speed, agility, and ranged damage',
        value: 12,
        minValue: 3,
        maxValue: 18,
      },
      {
        attributeId: 'constitution',
        name: 'Constitution',
        description: 'Health and physical resilience',
        value: 10,
        minValue: 3,
        maxValue: 18,
      },
    ],
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
    attributes: { total: 48, spent: 45, remaining: 3 },
    skills: { total: 15, spent: 0, remaining: 15 },
  },
};

const mockWorldConfig = {
  id: 'world-1',
  name: 'Test World',
  description: 'A test world',
  theme: 'fantasy',
  attributes: [
    {
      id: 'strength',
      name: 'Strength',
      description: 'Physical power and melee damage',
      minValue: 3,
      maxValue: 18,
    },
    {
      id: 'intelligence',
      name: 'Intelligence',
      description: 'Magical power and spell effectiveness',
      minValue: 3,
      maxValue: 18,
    },
    {
      id: 'dexterity',
      name: 'Dexterity',
      description: 'Speed, agility, and ranged damage',
      minValue: 3,
      maxValue: 18,
    },
    {
      id: 'constitution',
      name: 'Constitution',
      description: 'Health and physical resilience',
      minValue: 3,
      maxValue: 18,
    },
  ],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 12,
    attributePointPool: 48,
    skillPointPool: 15,
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

export const Default: Story = {
  args: {
    data: defaultData,
    onUpdate: () => {},
    onValidation: () => {},
    worldConfig: mockWorldConfig,
  },
};

export const FullyAllocated: Story = {
  args: {
    data: {
      ...defaultData,
      characterData: {
        ...defaultData.characterData,
        attributes: [
          { ...defaultData.characterData.attributes[0], value: 10 },
          { ...defaultData.characterData.attributes[1], value: 16 },
          { ...defaultData.characterData.attributes[2], value: 14 },
          { ...defaultData.characterData.attributes[3], value: 8 },
        ],
      },
      pointPools: {
        attributes: { total: 48, spent: 48, remaining: 0 },
        skills: { total: 15, spent: 0, remaining: 15 },
      },
    },
    onUpdate: () => {},
    onValidation: () => {},
    worldConfig: mockWorldConfig,
  },
};

export const WithValidationError: Story = {
  args: {
    data: {
      ...defaultData,
      validation: {
        1: {
          valid: false,
          errors: ['You must allocate all attribute points'],
          touched: true,
        },
      },
    },
    onUpdate: () => {},
    onValidation: () => {},
    worldConfig: mockWorldConfig,
  },
};
