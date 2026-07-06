import { Meta, StoryObj } from '@storybook/react';
import { WizardNavigation } from '@/components/shared/wizard/WizardNavigation';

const meta: Meta<typeof WizardNavigation> = {
  title: '02-Molecules/wizard/WizardNavigation',
  component: WizardNavigation,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    onCancel: () => {},
    onBack: () => {},
    onNext: () => {},
    totalSteps: 4,
  },
};

export default meta;
type Story = StoryObj<typeof WizardNavigation>;

export const FirstStep: Story = { args: { currentStep: 0 } };
export const MiddleStep: Story = { args: { currentStep: 1 } };
export const LastStep: Story = {
  args: { currentStep: 3, onComplete: () => {}, onNext: undefined },
};
export const Loading: Story = { args: { currentStep: 1, isLoading: true } };
