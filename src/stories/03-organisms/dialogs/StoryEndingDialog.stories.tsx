import type { Meta, StoryObj } from '@storybook/react';
import { StoryEndingDialog } from '@/components/StoryEndingDialog';

const meta: Meta<typeof StoryEndingDialog> = {
  title: '03-Organisms/dialogs/StoryEndingDialog',
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
      options: ['triumphant', 'tragic', 'hopeful', 'mysterious', 'default'],
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
    title: 'Victory Achieved',
    content: 'Your choices led to a positive outcome. The characters you helped are now thriving, and the world is a better place because of your decisions.',
    endingType: 'triumphant',
    continueText: 'Generate Ending',
    closeText: 'Continue Playing',
  },
};


export const Tragic: Story = {
  args: {
    isOpen: true,
    title: 'A Heavy Price',
    content: 'Despite your best efforts, things did not turn out as hoped. Your decisions led to unforeseen consequences, but even in failure, there are lessons to be learned.',
    endingType: 'tragic',
    continueText: 'Generate Ending',
    closeText: 'Continue Playing',
  },
};