import type { Meta, StoryObj } from '@storybook/react';
import { BackgroundStep } from './BackgroundStep';
import { WizardContainer, WizardProgress } from '@/components/shared/wizard';

const meta: Meta<typeof BackgroundStep> = {
  title: 'Narraitor/Character/Creation/CharacterCreationWizard/Step 4 Background',
  component: BackgroundStep,
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
            currentStep={3} 
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
  currentStep: 3,
  worldId: 'world-1',
  characterData: {
    name: 'Elara Moonshadow',
    description: 'A skilled mage from the northern kingdoms',
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
    attributes: { total: 48, spent: 48, remaining: 0 },
    skills: { total: 15, spent: 15, remaining: 0 },
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
    attributePointPool: 48,
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
        background: {
          history: 'Born in the mystical forests of Eldoria, Elara showed an early affinity for magic. She spent her youth studying under the archmage Theron, mastering the arcane arts. When her village was threatened by dark forces, she set out on a journey to find ancient artifacts that could protect her people.',
          personality: 'Wise beyond her years, yet curious and sometimes impulsive. She values knowledge and often gets lost in her studies. Despite her serious demeanor, she has a warm heart and fierce loyalty to her friends.',
          motivation: 'To protect the innocent and uncover the lost secrets of the ancient mages',
          goals: [
            'Master the forbidden spells of the ancients',
            'Find the Crystal of Eternal Light',
            'Establish a new school of magic',
          ],
        },
      },
    },
    onUpdate: () => {},
    onValidation: () => {},
    worldConfig: mockWorldConfig,
  },
};

export const WithValidationErrors: Story = {
  args: {
    data: {
      ...defaultData,
      characterData: {
        ...defaultData.characterData,
        background: {
          history: 'Too short',
          personality: 'Brief',
          motivation: 'Why',
          goals: [],
        },
      },
      validation: {
        3: {
          valid: false,
          errors: [
            'History must be at least 50 characters',
            'Personality must be at least 30 characters',
            'Motivation must be at least 10 characters',
          ],
          touched: true,
        },
      },
    },
    onUpdate: () => {},
    onValidation: () => {},
    worldConfig: mockWorldConfig,
  },
};
