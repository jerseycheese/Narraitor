import { Meta, StoryObj } from '@storybook/react';
import { WizardStep } from '@/components/shared/wizard/WizardStep';

const meta: Meta<typeof WizardStep> = {
  title: '02-Molecules/wizard/WizardStep',
  component: WizardStep,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WizardStep>;

export const Default: Story = {
  args: { children: <p>Tell us about your world.</p> },
};

export const WithError: Story = {
  args: {
    children: <p>Tell us about your world.</p>,
    error: 'Please give your world a name before continuing.',
  },
};
