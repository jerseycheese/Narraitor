import type { Meta, StoryObj } from '@storybook/react';
import { CharacterBackgroundDisplay } from './CharacterBackgroundDisplay';

const meta: Meta<typeof CharacterBackgroundDisplay> = {
  title: 'Narraitor/Character/Display/CharacterBackgroundDisplay',
  component: CharacterBackgroundDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays character background information including description, personality, motivation, and physical appearance for narrative RPG characters.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

const fullBackground = {
  description: 'A brave warrior from the northern highlands who left their clan to seek adventure in distant lands. Trained from childhood in the ancient ways of combat and honor.',
  personality: 'Bold and honorable with a quick temper, but fiercely loyal to friends. Has a dry sense of humor and enjoys sharing stories around the campfire.',
  motivation: 'To restore honor to their fallen clan and find the truth behind the mysterious disappearance of their mentor.',
  physicalDescription: 'Tall and muscular with distinctive scars across the left cheek and forearm. Piercing blue eyes and long auburn hair often braided with clan tokens.'
};

const minimalBackground = {
  description: 'A mysterious figure with unknown origins.',
  personality: 'Quiet and observant.',
  motivation: 'Seeks knowledge and understanding.'
};

const detailedBackground = {
  description: 'Born into nobility but cast out for refusing an arranged marriage, this character has spent years living among common folk and learning their struggles. What started as rebellion has become a genuine calling to help those who cannot help themselves.',
  personality: 'Compassionate yet pragmatic, with a sharp wit that can cut through deception. Maintains an air of refinement even in the roughest circumstances, but never looks down on others. Has a tendency to take on more responsibility than wise.',
  motivation: 'To use their noble education and resources to level the playing field for the common people, while proving that true nobility comes from actions, not birthright.',
  physicalDescription: 'Of medium height with an elegant bearing that speaks of noble upbringing. Hands show calluses from manual work, contrasting with fine bone structure. Dark hair streaked with premature silver from stress, and eyes that seem to see through pretense.'
};

export const Complete: Story = {
  args: {
    background: fullBackground
  }
};

export const WithoutPhysicalDescription: Story = {
  args: {
    background: minimalBackground
  }
};

export const DetailedCharacter: Story = {
  args: {
    background: detailedBackground
  }
};
