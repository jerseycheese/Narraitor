import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CharacterSuggestions } from '@/components/CharacterCreationWizard/components/CharacterSuggestions';
import { World } from '@/types/world.types';
import { CharacterCreationData } from '@/hooks/useCharacterCreationWizard';

const mockWorld: World = {
  id: 'world-1',
  name: 'Storybook Realm',
  description: 'A grim fantasy world of intrigue and steel.',
  genre: 'fantasy',
  attributes: [
    {
      id: 'attr-1',
      worldId: 'world-1',
      name: 'Strength',
      description: 'Physical power',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
      category: 'Physical',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      worldId: 'world-1',
      name: 'Swordplay',
      description: 'Skill with bladed weapons',
      attributeIds: ['attr-1'],
      difficulty: 'medium',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
    },
  ],
  settings: {
    maxAttributes: 10,
    maxSkills: 20,
    attributePointPool: 30,
    skillPointPool: 40,
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

const mockCharacterData: CharacterCreationData = {
  worldId: 'world-1',
  name: '',
  description: 'A disgraced knight seeking redemption.',
  portraitPlaceholder: '',
  attributes: [
    { attributeId: 'attr-1', name: 'Strength', value: 1, minValue: 1, maxValue: 10 },
  ],
  skills: [
    {
      skillId: 'skill-1',
      name: 'Swordplay',
      level: 1,
      minLevel: 1,
      maxLevel: 10,
      isSelected: false,
    },
  ],
  background: { history: '', personality: '', goals: [], motivation: '' },
};

// Stub the API so the "Suggest" button produces example suggestions in Storybook.
const withStubbedApi = (Story: React.ComponentType) => {
  global.fetch = (() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          name: 'Sir Aldric',
          background: {
            description: 'Once a celebrated champion, now haunted by a single failure.',
            personality: 'Stoic, loyal, quietly bitter.',
            motivation: 'To reclaim lost honor.',
            fears: ['cowardice', 'being forgotten'],
            physicalDescription: 'Scarred jaw, greying beard, dented plate armor.',
          },
          attributes: [{ id: 'attr-1', value: 8 }],
          skills: [{ id: 'skill-1', level: 7 }],
          level: 4,
        }),
    })) as unknown as typeof fetch;
  return <Story />;
};

const meta: Meta<typeof CharacterSuggestions> = {
  title: '03-Organisms/character/CharacterSuggestions',
  component: CharacterSuggestions,
  decorators: [withStubbedApi],
  parameters: {
    docs: {
      description: {
        component:
          'AI-powered character development suggestions for the creation wizard. Generates world-aligned description, background, attributes, and skills, each with adopt / edit / dismiss controls.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    world: mockWorld,
    concept: mockCharacterData.description,
    characterData: mockCharacterData,
    onAdopt: () => {},
  },
};
