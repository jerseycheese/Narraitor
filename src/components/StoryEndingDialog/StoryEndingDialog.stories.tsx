import type { Meta, StoryObj } from '@storybook/react';
import { StoryEndingDialog } from './StoryEndingDialog';

const meta: Meta<typeof StoryEndingDialog> = {
  title: 'Narraitor/Dialogs/StoryEndingDialog',
  component: StoryEndingDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A specialized dialog for displaying story endings with different moods and visual themes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the dialog is open or closed',
    },
    endingType: {
      control: 'select',
      options: ['triumphant', 'bittersweet', 'tragic', 'default'],
      description: 'The type of ending, affects visual styling',
    },
    onClose: { action: 'closed' },
    onContinue: { action: 'continued' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Triumphant: Story = {
  args: {
    isOpen: true,
    title: 'Victory at Last!',
    content: 'After a long and treacherous journey through the mystical lands of Aetheria, you have finally defeated the ancient dragon and saved the kingdom. The people cheer your name as you return home as a true hero.',
    endingType: 'triumphant',
    onContinue: undefined,
  },
};

export const Bittersweet: Story = {
  args: {
    isOpen: true,
    title: 'A Difficult Choice',
    content: 'You have saved the kingdom, but at great personal cost. Your closest companion has fallen in the final battle, and though the realm is safe, your heart carries the weight of loss. Peace has been won, but the price was higher than you ever imagined.',
    endingType: 'bittersweet',
    onContinue: undefined,
  },
};

export const Tragic: Story = {
  args: {
    isOpen: true,
    title: 'The End of Hope',
    content: 'Despite your best efforts, the darkness has consumed everything you fought to protect. The kingdom has fallen, and the ancient evil spreads across the land. Your journey ends in failure, but perhaps your sacrifice will inspire others to continue the fight.',
    endingType: 'tragic',
    onContinue: undefined,
  },
};

export const WithContinueButton: Story = {
  args: {
    isOpen: true,
    title: 'Chapter Complete',
    content: 'You have successfully completed this chapter of your adventure. The road ahead promises new challenges and discoveries.',
    endingType: 'default',
    onContinue: () => console.log('Continue clicked'),
    continueText: 'Next Chapter',
  },
};

export const CustomButtonText: Story = {
  args: {
    isOpen: true,
    title: 'Adventure Awaits',
    content: 'Your first quest is complete, but this is only the beginning of your legend.',
    endingType: 'triumphant',
    continueText: 'Begin New Quest',
    closeText: 'Return to Town',
    onContinue: () => console.log('New quest started'),
  },
};

export const JSXContent: Story = {
  args: {
    isOpen: true,
    title: 'The Final Revelation',
    content: (
      <div className="space-y-4">
        <p>
          As you stand before the ancient altar, the truth becomes clear. You are not just a wanderer—you are the prophesied one.
        </p>
        <p className="font-semibold italic">
          &ldquo;The blood of kings flows through your veins, and with it, the power to reshape this world.&rdquo;
        </p>
        <p>
          The choice is yours: embrace your destiny or forge a new path entirely.
        </p>
      </div>
    ),
    endingType: 'bittersweet',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    title: 'This dialog is closed',
    content: 'You should not see this content when the dialog is closed.',
    endingType: 'default',
  },
};