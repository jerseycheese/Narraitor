import { Meta, StoryObj } from '@storybook/react';
import { WizardProgress } from '@/components/shared/wizard/WizardProgress';

const steps = [
  { id: 'basics', label: 'Basics' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'skills', label: 'Skills' },
  { id: 'review', label: 'Review' },
];

const meta: Meta<typeof WizardProgress> = {
  title: '02-Molecules/wizard/WizardProgress',
  component: WizardProgress,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { steps },
  argTypes: { currentStep: { control: { type: 'range', min: 0, max: 3 } } },
};

export default meta;
type Story = StoryObj<typeof WizardProgress>;

export const FirstStep: Story = { args: { currentStep: 0 } };
export const MidWay: Story = { args: { currentStep: 2 } };
export const LastStep: Story = { args: { currentStep: 3 } };
