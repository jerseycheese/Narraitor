import { Meta, StoryObj } from '@storybook/react';
import { WizardContainer } from '@/components/shared/wizard/WizardContainer';

const meta: Meta<typeof WizardContainer> = {
  title: '02-Molecules/wizard/WizardContainer',
  component: WizardContainer,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WizardContainer>;

export const Default: Story = {
  args: {
    title: 'Create a World',
    children: <p>Step content goes here.</p>,
  },
};
