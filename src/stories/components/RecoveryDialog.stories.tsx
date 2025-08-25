import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { RecoveryNotification } from '@/components/shared/RecoveryNotification';

const meta: Meta<typeof RecoveryNotification> = {
  title: 'Components/RecoveryNotification',
  component: RecoveryNotification,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof RecoveryNotification>;

export const Default: Story = {
  args: {
    isVisible: true,
    lastSaved: '2023-12-15T14:30:00.000Z',
    recoveryData: {
      name: 'Elara Brightblade',
      currentStep: 2,
      hasAttributes: true,
      totalAttributePoints: 35,
      hasSkills: true,
      selectedSkillCount: 4,
      hasBackground: false,
    },
    hasCurrentData: false,
    onRecover: action('recovered'),
    onDismiss: action('dismissed'),
  },
};

export const WithoutTimestamp: Story = {
  args: {
    isVisible: true,
    lastSaved: undefined,
    recoveryData: {
      name: 'Unnamed Character',
      currentStep: 1,
      hasAttributes: false,
      hasSkills: false,
      hasBackground: false,
    },
    hasCurrentData: false,
    onRecover: action('recovered'),
    onDismiss: action('dismissed'),
  },
};

export const WithConflictWarning: Story = {
  args: {
    isVisible: true,
    lastSaved: '2023-12-15T14:30:00.000Z',
    recoveryData: {
      name: 'Sir Galahad',
      currentStep: 3,
      hasAttributes: true,
      totalAttributePoints: 40,
      hasSkills: true,
      selectedSkillCount: 6,
      hasBackground: true,
    },
    hasCurrentData: true, // This will show the warning
    onRecover: action('recovered'),
    onDismiss: action('dismissed'),
  },
};

export const CorruptedData: Story = {
  args: {
    isVisible: true,
    lastSaved: '2023-12-15T14:30:00.000Z',
    recoveryData: undefined, // No preview available due to corruption
    hasCurrentData: false,
    onRecover: action('recovered'),
    onDismiss: action('dismissed'),
  },
};

export const Hidden: Story = {
  args: {
    isVisible: false,
    lastSaved: '2023-12-15T14:30:00.000Z',
    recoveryData: {
      name: 'Test Character',
      currentStep: 0,
      hasAttributes: false,
      hasSkills: false,
      hasBackground: false,
    },
    hasCurrentData: false,
    onRecover: action('recovered'),
    onDismiss: action('dismissed'),
  },
};