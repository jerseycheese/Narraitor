import type { Meta, StoryObj } from '@storybook/react';
import { AIIntegrationDemo } from './AIIntegrationDemo';

const meta: Meta<typeof AIIntegrationDemo> = {
  title: 'Narraitor/AI Integration/Context Demo',
  component: AIIntegrationDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SmallWorldSimpleCharacter: Story = {
  args: {
    testScenario: 'small-world-simple-character',
  },
};

export const LargeWorldComplexCharacter: Story = {
  args: {
    testScenario: 'large-world-complex-character',
  },
};

export const MultipleCharacters: Story = {
  args: {
    testScenario: 'multiple-characters',
  },
};

export const EdgeCases: Story = {
  args: {
    testScenario: 'edge-cases',
  },
};

export const TokenUsageMonitoring: Story = {
  args: {
    testScenario: 'token-monitoring',
    showTokenMetrics: true,
  },
};
