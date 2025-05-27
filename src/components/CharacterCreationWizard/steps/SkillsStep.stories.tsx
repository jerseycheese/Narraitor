import type { Meta, StoryObj } from '@storybook/react';
import { SkillsStep } from './SkillsStep';
import { WizardContainer, WizardProgress } from '@/components/shared/wizard';

const meta: Meta<typeof SkillsStep> = {
  title: 'Narraitor/Character/Creation/CharacterCreationWizard/Step 3 Skills',
  component: SkillsStep,
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
            currentStep={2} 
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
  currentStep: 2,
  worldId: 'world-1',
  characterData: {
    name: 'Elara Moonshadow',
    description: 'A skilled mage from the northern kingdoms',
    attributes: [],
    skills: [
      {
        skillId: 'magic',
        name: 'Magic',
        description: 'The ability to cast spells and manipulate arcane energy',
        level: 1,
        linkedAttributeId: 'intelligence',
        isSelected: false,
      },
      {
        skillId: 'swordplay',
        name: 'Swordplay',
        description: 'Proficiency with bladed weapons in combat',
        level: 1,
        linkedAttributeId: 'strength',
        isSelected: false,
      },
      {
        skillId: 'archery',
        name: 'Archery',
        description: 'Skill with bows and ranged combat',
        level: 1,
        linkedAttributeId: 'dexterity',
        isSelected: false,
      },
      {
        skillId: 'stealth',
        name: 'Stealth',
        description: 'Moving silently and avoiding detection',
        level: 1,
        linkedAttributeId: 'dexterity',
        isSelected: false,
      },
      {
        skillId: 'herbalism',
        name: 'Herbalism',
        description: 'Knowledge of plants and their medicinal properties',
        level: 1,
        linkedAttributeId: 'intelligence',
        isSelected: false,
      },
      {
        skillId: 'diplomacy',
        name: 'Diplomacy',
        description: 'The art of negotiation and persuasion',
        level: 1,
        linkedAttributeId: 'intelligence',
        isSelected: false,
      },
    ],
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
    skills: { total: 15, spent: 0, remaining: 15 },
  },
};

const mockWorldConfig = {
  id: 'world-1',
  name: 'Test World',
  description: 'A test world',
  theme: 'fantasy',
  attributes: [],
  skills: [
    {
      id: 'magic',
      name: 'Magic',
      description: 'The ability to cast spells and manipulate arcane energy',
      linkedAttributeId: 'intelligence',
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'swordplay',
      name: 'Swordplay',
      description: 'Proficiency with bladed weapons in combat',
      linkedAttributeId: 'strength',
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'archery',
      name: 'Archery',
      description: 'Skill with bows and ranged combat',
      linkedAttributeId: 'dexterity',
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'stealth',
      name: 'Stealth',
      description: 'Moving silently and avoiding detection',
      linkedAttributeId: 'dexterity',
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'herbalism',
      name: 'Herbalism',
      description: 'Knowledge of plants and their medicinal properties',
      linkedAttributeId: 'intelligence',
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'diplomacy',
      name: 'Diplomacy',
      description: 'The art of negotiation and persuasion',
      linkedAttributeId: 'intelligence',
      minValue: 0,
      maxValue: 10,
    },
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 12,
    attributePointPool: 48,
    skillPointPool: 15,
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

export const NoSelection: Story = {
  args: {
    data: defaultData,
    onUpdate: () => {},
    onValidation: () => {},
    worldConfig: mockWorldConfig,
  },
};

export const WithSelection: Story = {
  args: {
    data: {
      ...defaultData,
      characterData: {
        ...defaultData.characterData,
        skills: [
          { ...defaultData.characterData.skills[0], isSelected: true }, // Magic
          { ...defaultData.characterData.skills[1], isSelected: false },
          { ...defaultData.characterData.skills[2], isSelected: false },
          { ...defaultData.characterData.skills[3], isSelected: true }, // Stealth
          { ...defaultData.characterData.skills[4], isSelected: true }, // Herbalism
          { ...defaultData.characterData.skills[5], isSelected: false },
        ],
      },
    },
    onUpdate: () => {},
    onValidation: () => {},
    worldConfig: mockWorldConfig,
  },
};

export const MaxSelection: Story = {
  args: {
    data: {
      ...defaultData,
      characterData: {
        ...defaultData.characterData,
        skills: defaultData.characterData.skills.map(skill => ({
          ...skill,
          isSelected: true,
        })),
      },
    },
    onUpdate: () => {},
    onValidation: () => {},
    worldConfig: mockWorldConfig,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the maximum of 8 skills selected (in this case, all 6 available skills).',
      },
    },
  },
};

export const WithValidationError: Story = {
  args: {
    data: {
      ...defaultData,
      validation: {
        2: {
          valid: false,
          errors: ['You must select at least 1 skill'],
          touched: true,
        },
      },
    },
    onUpdate: () => {},
    onValidation: () => {},
    worldConfig: mockWorldConfig,
  },
};