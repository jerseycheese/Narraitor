import type { Meta, StoryObj } from '@storybook/react';
import { Trophy } from 'lucide-react';
import { AchievementDialog } from '@/components/AchievementDialog';

const meta: Meta<typeof AchievementDialog> = {
  title: '03-Organisms/dialogs/AchievementDialog',
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

export const AchievementFromEnding: Story = {
  args: {
    isOpen: true,
    title: '03-Organisms/dialogs/AchievementDialog',
    description: 'You overcame the trials in the Mystic Forest and helped restore balance to the realm.',
    achievement: 'Forest Guardian',
    type: 'milestone',
    icon: <Trophy className="w-8 h-8" />,
    buttonText: 'Continue',
  },
};

export const SimpleAchievement: Story = {
  args: {
    isOpen: true,
    title: '03-Organisms/dialogs/AchievementDialog',
    description: 'You made a difficult choice that showed true courage in the face of adversity.',
    achievement: 'Brave Heart',
    type: 'milestone',
    icon: <Trophy className="w-8 h-8" />,
    buttonText: 'Continue',
  },
};

export const LongDescriptionAchievement: Story = {
  args: {
    isOpen: true,
    title: '03-Organisms/dialogs/AchievementDialog',
    description: 'Through wisdom and patience, you managed to unite the warring factions and bring peace to the troubled lands. Your diplomatic skills proved invaluable in resolving the ancient conflict.',
    achievement: 'Peacemaker',
    type: 'milestone',
    icon: <Trophy className="w-8 h-8" />,
    buttonText: 'Continue',
  },
};

export const WithJSXDescription: Story = {
  args: {
    isOpen: true,
    title: '03-Organisms/dialogs/AchievementDialog',
    description: (
      <div className="space-y-2">
        <p>You demonstrated exceptional leadership by:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Uniting the divided council</li>
          <li>Negotiating a peaceful resolution</li>
          <li>Protecting the innocent</li>
        </ul>
      </div>
    ),
    achievement: 'Natural Leader',
    type: 'milestone',
    icon: <Trophy className="w-8 h-8" />,
    buttonText: 'Continue',
  },
};