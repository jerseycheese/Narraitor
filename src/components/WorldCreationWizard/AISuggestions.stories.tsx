import type { Meta, StoryObj } from '@storybook/react';
import { AISuggestions } from './AISuggestions';
import { AttributeSuggestion, SkillSuggestion } from './WizardState';

const meta: Meta<typeof AISuggestions> = {
  title: 'Narraitor/World/AISuggestions',
  component: AISuggestions,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'AI-powered suggestions for world attributes and skills based on world description'
      }
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockAttributes: AttributeSuggestion[] = [
  {
    name: 'Arcane Power',
    description: 'Magical energy and spellcasting ability',
    minValue: 1,
    maxValue: 10,
    category: 'Magical',
    accepted: false,
  },
  {
    name: 'Dragon Affinity',
    description: 'Connection to draconic beings',
    minValue: 1,
    maxValue: 10,
    category: 'Magical',
    accepted: true,
  },
  {
    name: 'Physical Prowess',
    description: 'Strength and endurance',
    minValue: 1,
    maxValue: 10,
    category: 'Physical',
    accepted: false,
  },
];

const mockSkills: SkillSuggestion[] = [
  {
    name: 'Spellcasting',
    description: 'Ability to cast magical spells',
    difficulty: 'hard',
    category: 'Magic',
    linkedAttributeName: 'Arcane Power',
    accepted: true,
  },
  {
    name: 'Dragon Riding',
    description: 'Skill in commanding and riding dragons',
    difficulty: 'hard',
    category: 'Physical',
    linkedAttributeName: 'Dragon Affinity',
    accepted: false,
  },
  {
    name: 'Alchemy',
    description: 'Creating potions and magical items',
    difficulty: 'medium',
    category: 'Magic',
    linkedAttributeName: 'Arcane Power',
    accepted: false,
  },
];

export const Default: Story = {
  args: {
    loading: false,
    attributes: mockAttributes,
    skills: mockSkills,
    onAcceptAttribute: (attribute: AttributeSuggestion) => console.log('Accept attribute:', attribute),
    onRejectAttribute: (attribute: AttributeSuggestion) => console.log('Reject attribute:', attribute),
    onAcceptSkill: (skill: SkillSuggestion) => console.log('Accept skill:', skill),
    onRejectSkill: (skill: SkillSuggestion) => console.log('Reject skill:', skill),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    attributes: [],
    skills: [],
    onAcceptAttribute: () => {},
    onRejectAttribute: () => {},
    onAcceptSkill: () => {},
    onRejectSkill: () => {},
  },
};

export const Empty: Story = {
  args: {
    loading: false,
    attributes: [],
    skills: [],
    onAcceptAttribute: () => {},
    onRejectAttribute: () => {},
    onAcceptSkill: () => {},
    onRejectSkill: () => {},
  },
};

export const Error: Story = {
  args: {
    loading: false,
    error: 'Failed to generate AI suggestions. Please try again.',
    attributes: [],
    skills: [],
    onAcceptAttribute: () => {},
    onRejectAttribute: () => {},
    onAcceptSkill: () => {},
    onRejectSkill: () => {},
  },
};

export const AttributesOnly: Story = {
  args: {
    loading: false,
    attributes: mockAttributes,
    skills: [],
    onAcceptAttribute: (attribute: AttributeSuggestion) => console.log('Accept attribute:', attribute),
    onRejectAttribute: (attribute: AttributeSuggestion) => console.log('Reject attribute:', attribute),
    onAcceptSkill: () => {},
    onRejectSkill: () => {},
  },
};

export const SkillsOnly: Story = {
  args: {
    loading: false,
    attributes: [],
    skills: mockSkills,
    onAcceptAttribute: () => {},
    onRejectAttribute: () => {},
    onAcceptSkill: (skill: SkillSuggestion) => console.log('Accept skill:', skill),
    onRejectSkill: (skill: SkillSuggestion) => console.log('Reject skill:', skill),
  },
};

export const AllAccepted: Story = {
  args: {
    loading: false,
    attributes: mockAttributes.map(attr => ({ ...attr, accepted: true })),
    skills: mockSkills.map(skill => ({ ...skill, accepted: true })),
    onAcceptAttribute: () => {},
    onRejectAttribute: () => {},
    onAcceptSkill: () => {},
    onRejectSkill: () => {},
  },
};

export const Interactive: Story = {
  args: {
    loading: false,
    attributes: mockAttributes,
    skills: mockSkills,
    onAcceptAttribute: (attribute: AttributeSuggestion) => {
      console.log('Accept attribute:', attribute);
      alert(`Accepted: ${attribute.name}`);
    },
    onRejectAttribute: (attribute: AttributeSuggestion) => {
      console.log('Reject attribute:', attribute);
      alert(`Rejected: ${attribute.name}`);
    },
    onAcceptSkill: (skill: SkillSuggestion) => {
      console.log('Accept skill:', skill);
      alert(`Accepted: ${skill.name}`);
    },
    onRejectSkill: (skill: SkillSuggestion) => {
      console.log('Reject skill:', skill);
      alert(`Rejected: ${skill.name}`);
    },
  },
};