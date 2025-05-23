import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCreationWizard } from './CharacterCreationWizard';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { World } from '@/types/world.types';

const meta: Meta<typeof CharacterCreationWizard> = {
  title: 'Narraitor/Character/CharacterCreationWizard',
  component: CharacterCreationWizard,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create test world
const createTestWorld = () => {
  // Reset stores
  characterStore.getState().reset();
  worldStore.getState().reset();
  
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
  
  console.log('[createTestWorld] Created world with ID:', worldId);
  console.log('[createTestWorld] World store state:', worldStore.getState().worlds);
  
  return worldId;
};

export const Step1BasicInfo: Story = {
  render: () => {
    const worldId = createTestWorld();
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <CharacterCreationWizard worldId={worldId} initialStep={0} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'The first step of character creation where users enter basic information like name and description.',
      },
    },
  },
};

export const Step2Attributes: Story = {
  render: () => {
    const worldId = createTestWorld();
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <CharacterCreationWizard worldId={worldId} initialStep={1} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'The second step where users allocate attribute points to their character.',
      },
    },
  },
};

export const Step3Skills: Story = {
  render: () => {
    const worldId = createTestWorld();
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <CharacterCreationWizard worldId={worldId} initialStep={2} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'The third step where users select and assign skill points.',
      },
    },
  },
};

export const Step4Background: Story = {
  render: () => {
    const worldId = createTestWorld();
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <CharacterCreationWizard worldId={worldId} initialStep={3} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'The fourth step where users create their character\'s background story.',
      },
    },
  },
};

// Note: Step 5 (Review) would go here when implemented

export const WithExistingCharacter: Story = {
  render: () => {
    const worldId = createTestWorld();
    
    // Add an existing character to test name uniqueness validation
    characterStore.getState().createCharacter({
      name: 'Existing Hero',
      worldId: worldId,
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
    
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <CharacterCreationWizard worldId={worldId} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows validation when trying to create a character with a name that already exists in the world.',
      },
    },
  },
};

export const WithAutoSaveData: Story = {
  render: () => {
    const worldId = createTestWorld();
    
    // Pre-populate sessionStorage with saved data
    const savedData = {
      currentStep: 0,
      worldId: worldId,
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
    
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <CharacterCreationWizard worldId={worldId} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates auto-save functionality by pre-loading saved data from sessionStorage.',
      },
    },
  },
};

export const MinimalWorld: Story = {
  render: () => {
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
        <CharacterCreationWizard worldId={worldId} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A simplified world configuration with only 3 attributes and 3 skills for easier testing.',
      },
    },
  },
};