import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCreationWizard } from './CharacterCreationWizard';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { generateUniqueId } from '@/lib/utils/generateId';
import { World } from '@/types/world.types';

const meta: Meta<typeof CharacterCreationWizard> = {
  title: 'Narraitor/Character/CharacterCreationWizard',
  component: CharacterCreationWizard,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      // Reset stores before each story
      characterStore.getState().reset();
      worldStore.getState().reset();
      
      // Create a test world
      const testWorld: Omit<World, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Storybook Test World',
        description: 'A fantasy world for testing character creation',
        theme: 'fantasy',
        attributes: [
          { id: 'attr-1', name: 'Strength', description: 'Physical power', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
          { id: 'attr-2', name: 'Intelligence', description: 'Mental acuity', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
          { id: 'attr-3', name: 'Dexterity', description: 'Speed and agility', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
          { id: 'attr-4', name: 'Constitution', description: 'Health and endurance', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
          { id: 'attr-5', name: 'Wisdom', description: 'Insight and awareness', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
          { id: 'attr-6', name: 'Charisma', description: 'Force of personality', worldId: '', baseValue: 10, minValue: 1, maxValue: 10 },
        ],
        skills: [
          { id: 'skill-1', name: 'Swordsmanship', description: 'Skill with bladed weapons', worldId: '', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-2', name: 'Archery', description: 'Skill with ranged weapons', worldId: '', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-3', name: 'Magic', description: 'Arcane knowledge', worldId: '', difficulty: 'hard', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-4', name: 'Stealth', description: 'Moving unseen', worldId: '', difficulty: 'easy', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-5', name: 'Diplomacy', description: 'Social skills', worldId: '', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-6', name: 'Survival', description: 'Wilderness skills', worldId: '', difficulty: 'easy', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-7', name: 'Healing', description: 'Medical knowledge', worldId: '', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-8', name: 'Crafting', description: 'Creating items', worldId: '', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-9', name: 'Athletics', description: 'Physical prowess', worldId: '', difficulty: 'easy', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-10', name: 'Perception', description: 'Noticing details', worldId: '', difficulty: 'easy', baseValue: 1, minValue: 1, maxValue: 5 },
        ],
        settings: {
          maxAttributes: 6,
          maxSkills: 12,
          attributePointPool: 27,
          skillPointPool: 20,
        },
      };
      
      const worldId = worldStore.getState().createWorld(testWorld);
      worldStore.getState().setCurrentWorld(worldId);
      
      // Update the args with the created worldId
      const updatedArgs = { ...context.args, worldId };
      
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <Story {...updatedArgs} />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Step1BasicInfo: Story = {
  args: {
    worldId: 'will-be-set-by-decorator',
  },
  parameters: {
    docs: {
      description: {
        story: 'The first step of character creation where users enter basic information like name and description.',
      },
    },
  },
};

export const WithExistingCharacter: Story = {
  args: {
    worldId: 'will-be-set-by-decorator',
  },
  decorators: [
    (Story, context) => {
      // Add an existing character to test name uniqueness validation
      const worldId = context.args.worldId || worldStore.getState().currentWorldId;
      characterStore.getState().createCharacter({
        name: 'Existing Hero',
        worldId: worldId!,
        level: 1,
        attributes: [],
        skills: [],
        background: {
          description: '',
          personality: '',
          motivation: '',
        },
        isPlayer: true,
        status: { hp: 100, mp: 50, stamina: 100 },
      });
      
      return <Story {...context.args} />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows validation when trying to create a character with a name that already exists in the world.',
      },
    },
  },
};

export const WithAutoSaveData: Story = {
  args: {
    worldId: 'will-be-set-by-decorator',
  },
  decorators: [
    (Story, context) => {
      const worldId = context.args.worldId || worldStore.getState().currentWorldId;
      
      // Pre-populate sessionStorage with saved data
      const savedData = {
        currentStep: 0,
        worldId: worldId!,
        characterData: {
          name: 'Auto-saved Hero',
          description: 'This data was restored from auto-save',
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
          attributes: { total: 27, spent: 0, remaining: 27 },
          skills: { total: 20, spent: 0, remaining: 20 },
        },
      };
      
      sessionStorage.setItem(`character-creation-${worldId}`, JSON.stringify(savedData));
      
      return <Story {...context.args} />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates auto-save functionality by pre-loading saved data from sessionStorage.',
      },
    },
  },
};

export const MinimalWorld: Story = {
  args: {
    worldId: 'will-be-set-by-decorator',
  },
  decorators: [
    (Story, context) => {
      // Reset stores
      characterStore.getState().reset();
      worldStore.getState().reset();
      
      // Create a minimal world with fewer attributes and skills
      const minimalWorld: Omit<World, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Minimal Test World',
        description: 'A simple world with minimal configuration',
        theme: 'modern',
        attributes: [
          { id: 'attr-1', name: 'Body', description: 'Physical capability', worldId: '', baseValue: 5, minValue: 1, maxValue: 10 },
          { id: 'attr-2', name: 'Mind', description: 'Mental capability', worldId: '', baseValue: 5, minValue: 1, maxValue: 10 },
          { id: 'attr-3', name: 'Social', description: 'Social capability', worldId: '', baseValue: 5, minValue: 1, maxValue: 10 },
        ],
        skills: [
          { id: 'skill-1', name: 'Fighting', description: 'Combat ability', worldId: '', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-2', name: 'Investigation', description: 'Finding clues', worldId: '', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 5 },
          { id: 'skill-3', name: 'Persuasion', description: 'Convincing others', worldId: '', difficulty: 'easy', baseValue: 1, minValue: 1, maxValue: 5 },
        ],
        settings: {
          maxAttributes: 3,
          maxSkills: 6,
          attributePointPool: 15,
          skillPointPool: 10,
        },
      };
      
      const worldId = worldStore.getState().createWorld(minimalWorld);
      worldStore.getState().setCurrentWorld(worldId);
      
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <Story {...context.args} worldId={worldId} />
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'A simplified world configuration with only 3 attributes and 3 skills for easier testing.',
      },
    },
  },
};