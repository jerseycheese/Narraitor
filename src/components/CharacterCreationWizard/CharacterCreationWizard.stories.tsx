import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCreationWizard } from './CharacterCreationWizard';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { World } from '@/types/world.types';

const meta: Meta<typeof CharacterCreationWizard> = {
  title: 'Narraitor/Character/Creation/CharacterCreationWizard',
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
  
  return worldId;
};

export const FullWizard: Story = {
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
        story: 'The complete character creation wizard flow, starting from the beginning. Includes portrait generation in step 5.',
      },
    },
  },
};

export const StartAtPortraitStep: Story = {
  render: () => {
    const worldId = createTestWorld();
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <CharacterCreationWizard worldId={worldId} initialStep={4} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Character creation starting at the Portrait generation step. Shows AI portrait generation with the new integrated system.',
      },
    },
  },
};

export const WithGeneratedCharacter: Story = {
  render: () => {
    const worldId = createTestWorld();
    
    // Simulate character data that would be present at the portrait step
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Story Context:</strong> This demonstrates the wizard after character generation 
            has occurred, where the character now has AI-generated data including portrait integration.
          </p>
        </div>
        <CharacterCreationWizard worldId={worldId} initialStep={4} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Character creation with AI-generated character data, demonstrating the new portrait generation workflow and integration with character data.',
      },
    },
  },
};