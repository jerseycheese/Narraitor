import { Meta, StoryObj } from '@storybook/react';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof SimpleModal> = {
  title: '02-Molecules/ui-components/SimpleModal',
  component: SimpleModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { isOpen: true, onClose: () => {}, title: 'Confirm' },
};

export default meta;
type Story = StoryObj<typeof SimpleModal>;

export const Default: Story = {
  args: {
    children: <p>Are you sure you want to start a new story?</p>,
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Start over?',
    children: <p>Your current progress will be saved before you begin.</p>,
    footer: (
      <>
        <Button variant="secondary">Cancel</Button>
        <Button>Start</Button>
      </>
    ),
  },
};
