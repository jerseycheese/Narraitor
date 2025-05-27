import type { Meta, StoryObj } from '@storybook/react';
import { BasicInfoStep } from './BasicInfoStep';
import { WizardContainer, WizardProgress } from '@/components/shared/wizard';

const meta: Meta<typeof BasicInfoStep> = {
  title: 'Narraitor/Character/Creation/CharacterCreationWizard/Step 1 BasicInfo',
  component: BasicInfoStep,
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
            currentStep={0} 
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
    onUpdate: () => {},
    onValidation: () => {},
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
    onUpdate: () => {},
    onValidation: () => {},
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
    onUpdate: () => {},
    onValidation: () => {},
    worldConfig: mockWorldConfig,
  },
};