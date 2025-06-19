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
    attributes: [
      { id: 'strength', name: 'Strength', value: 8 },
      { id: 'intelligence', name: 'Intelligence', value: 10 },
      { id: 'dexterity', name: 'Dexterity', value: 7 },
      { id: 'charisma', name: 'Charisma', value: 6 },
    ],
    skills: [
      {
        skillId: 'magic',
        name: 'Magic',
        description: 'The ability to cast spells and manipulate arcane energy',
        level: 1,
        attributeIds: ['intelligence'],
        isSelected: false,
      },
      {
        skillId: 'swordplay',
        name: 'Swordplay',
        description: 'Proficiency with bladed weapons in combat',
        level: 1,
        attributeIds: ['strength'],
        isSelected: false,
      },
      {
        skillId: 'archery',
        name: 'Archery',
        description: 'Skill with bows and ranged combat',
        level: 1,
        attributeIds: ['dexterity'],
        isSelected: false,
      },
      {
        skillId: 'stealth',
        name: 'Stealth',
        description: 'Moving silently and avoiding detection',
        level: 1,
        attributeIds: ['dexterity'],
        isSelected: false,
      },
      {
        skillId: 'herbalism',
        name: 'Herbalism',
        description: 'Knowledge of plants and their medicinal properties',
        level: 1,
        attributeIds: ['intelligence'],
        isSelected: false,
      },
      {
        skillId: 'diplomacy',
        name: 'Diplomacy',
        description: 'The art of negotiation and persuasion',
        level: 1,
        attributeIds: ['intelligence', 'charisma'],
        isSelected: false,
      },
      {
        skillId: 'combat',
        name: 'Combat',
        description: 'Physical fighting and weapon mastery',
        level: 1,
        attributeIds: ['strength', 'dexterity'],
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
  attributes: [
    { id: 'strength', name: 'Strength', description: 'Physical power', minValue: 1, maxValue: 10, baseValue: 5 },
    { id: 'intelligence', name: 'Intelligence', description: 'Mental acuity', minValue: 1, maxValue: 10, baseValue: 5 },
    { id: 'dexterity', name: 'Dexterity', description: 'Agility and coordination', minValue: 1, maxValue: 10, baseValue: 5 },
    { id: 'charisma', name: 'Charisma', description: 'Social influence', minValue: 1, maxValue: 10, baseValue: 5 },
  ],
  skills: [
    {
      id: 'magic',
      name: 'Magic',
      description: 'The ability to cast spells and manipulate arcane energy',
      attributeIds: ['intelligence'],
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'swordplay',
      name: 'Swordplay',
      description: 'Proficiency with bladed weapons in combat',
      attributeIds: ['strength'],
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'archery',
      name: 'Archery',
      description: 'Skill with bows and ranged combat',
      attributeIds: ['dexterity'],
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'stealth',
      name: 'Stealth',
      description: 'Moving silently and avoiding detection',
      attributeIds: ['dexterity'],
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'herbalism',
      name: 'Herbalism',
      description: 'Knowledge of plants and their medicinal properties',
      attributeIds: ['intelligence'],
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'diplomacy',
      name: 'Diplomacy',
      description: 'The art of negotiation and persuasion',
      attributeIds: ['intelligence', 'charisma'],
      minValue: 0,
      maxValue: 10,
    },
    {
      id: 'combat',
      name: 'Combat',
      description: 'Physical fighting and weapon mastery',
      attributeIds: ['strength', 'dexterity'],
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
          { ...defaultData.characterData.skills[1], isSelected: false }, // Swordplay
          { ...defaultData.characterData.skills[2], isSelected: false }, // Archery
          { ...defaultData.characterData.skills[3], isSelected: true }, // Stealth
          { ...defaultData.characterData.skills[4], isSelected: true }, // Herbalism
          { ...defaultData.characterData.skills[5], isSelected: true }, // Diplomacy (multi-attribute)
          { ...defaultData.characterData.skills[6], isSelected: false }, // Combat (multi-attribute)
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
        story: 'Shows the maximum of 8 skills selected (in this case, all 7 available skills including multi-attribute skills).',
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
