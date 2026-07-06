import { Meta, StoryObj } from '@storybook/react';
import { ErrorBlock } from '@/components/shared/ErrorBlock';

const meta: Meta<typeof ErrorBlock> = {
  title: '01-Atoms/feedback/ErrorBlock',
  component: ErrorBlock,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorBlock>;

export const SingleError: Story = {
  args: { errors: ['A name is required before you can continue.'] },
};

export const MultipleErrors: Story = {
  args: {
    errors: [
      'A name is required before you can continue.',
      'Pick at least one attribute.',
      'The description is too short.',
    ],
  },
};
