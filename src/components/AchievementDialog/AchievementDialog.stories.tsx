import type { Meta, StoryObj } from '@storybook/react';
import { AchievementDialog } from './AchievementDialog';

const meta: Meta<typeof AchievementDialog> = {
  title: 'Narraitor/Dialogs/AchievementDialog',
  component: AchievementDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A celebration dialog for displaying achievements, quest completions, and other milestones with rewards.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the dialog is open or closed',
    },
    type: {
      control: 'select',
      options: ['quest', 'skill', 'discovery', 'milestone', 'default'],
      description: 'The type of achievement, affects visual styling',
    },
    icon: {
      control: false,
      description: 'Optional icon to display at the top of the dialog',
    },
    onClose: { action: 'closed' },
    onContinue: { action: 'continued' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Quest: Story = {
  args: {
    isOpen: true,
    title: 'Quest Completed!',
    description: 'You have successfully completed the "Dragon\'s Hoard" quest and saved the village from the ancient dragon\'s terror.',
    achievement: 'Dragon Slayer',
    reward: '500 Gold Coins + Legendary Sword',
    type: 'quest',
    icon: '🐉',
  },
};

export const Skill: Story = {
  args: {
    isOpen: true,
    title: 'Skill Mastered!',
    description: 'Through dedication and practice, you have achieved mastery in the ancient art of swordsmanship.',
    achievement: 'Master Swordsman',
    reward: '+10 Attack Power',
    type: 'skill',
    icon: '⚔️',
  },
};

export const Discovery: Story = {
  args: {
    isOpen: true,
    title: 'Discovery Made!',
    description: 'You have uncovered the lost ruins of the ancient civilization, revealing secrets that have been hidden for centuries.',
    achievement: 'Explorer of the Lost',
    reward: 'Ancient Map Fragment',
    type: 'discovery',
    icon: '🗺️',
  },
};

export const Milestone: Story = {
  args: {
    isOpen: true,
    title: 'Milestone Reached!',
    description: 'You have reached level 50, marking a significant milestone in your adventuring career.',
    achievement: 'Veteran Adventurer',
    reward: 'Skill Point + Special Ability',
    type: 'milestone',
    icon: '⭐',
  },
};

export const WithoutReward: Story = {
  args: {
    isOpen: true,
    title: 'Achievement Unlocked!',
    description: 'You have successfully completed your first story chapter. The foundation of your legend has been laid.',
    achievement: 'First Steps',
    type: 'milestone',
    icon: '🎯',
  },
};

export const WithContinueCallback: Story = {
  args: {
    isOpen: true,
    title: 'Rare Discovery!',
    description: 'You have found a mystical portal that leads to an undiscovered realm filled with ancient magic and forgotten treasures.',
    achievement: 'Portal Walker',
    reward: 'Portal Key + Magic Essence',
    type: 'discovery',
    icon: '🌀',
    buttonText: 'Enter Portal',
    onContinue: () => console.log('Entering portal...'),
  },
};

export const CustomButtonText: Story = {
  args: {
    isOpen: true,
    title: 'Boss Defeated!',
    description: 'You have defeated the Shadow Lord and brought peace to the Darkwood Forest.',
    achievement: 'Shadow Bane',
    reward: '1000 Experience Points',
    type: 'quest',
    icon: '👑',
    buttonText: 'Claim Victory',
  },
};

export const JSXDescription: Story = {
  args: {
    isOpen: true,
    title: 'Epic Achievement!',
    description: (
      <div className="space-y-3">
        <p>
          You have accomplished something truly extraordinary! Your journey has led to:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Mastery of all four elemental schools of magic</li>
          <li>Alliance with the Dragon Council</li>
          <li>Restoration of the World Tree</li>
        </ul>
        <p className="font-semibold text-purple-700">
          You are now recognized as an Archmage of the realm!
        </p>
      </div>
    ),
    achievement: 'Archmage Supreme',
    reward: 'Staff of Infinite Power + Archmage Robes',
    type: 'milestone',
    icon: '🔮',
  },
};

export const LongContent: Story = {
  args: {
    isOpen: true,
    title: 'Epic Saga Completed!',
    description: 'After months of adventure, countless battles, and difficult choices, you have completed the Epic Saga of the Eternal Flame. Your decisions have shaped the fate of three kingdoms, and your name will be remembered in the annals of history. The bonds you forged, the enemies you defeated, and the sacrifices you made have all led to this moment of triumph.',
    achievement: 'Legend of the Eternal Flame',
    reward: 'Legendary Title + 10,000 Gold + Eternal Flame Artifact',
    type: 'milestone',
    icon: '🔥',
    buttonText: 'Enter the Hall of Legends',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    title: 'This dialog is closed',
    description: 'You should not see this content when the dialog is closed.',
    achievement: 'Hidden Achievement',
    type: 'default',
  },
};