import type { Meta, StoryObj } from '@storybook/react';
import { TutorialHint } from '@/components/TutorialHint/TutorialHint';

const meta: Meta<typeof TutorialHint> = {
  title: 'Atoms/Feedback/TutorialHint',
  component: TutorialHint,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TutorialHint>;

export const Default: Story = {
  args: {
    id: 'example-hint',
    children: 'This is a helpful hint for the user.',
  },
};

export const WithHtmlContent: Story = {
  args: {
    id: 'html-hint',
    children: (
      <div>
        <strong>Did you know?</strong>
        <p>You can customize this further in settings.</p>
      </div>
    ),
  },
};
