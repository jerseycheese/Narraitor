import { Meta, StoryObj } from '@storybook/react';
import { ProviderCard } from '@/components/ai/ProviderCard';

const meta: Meta<typeof ProviderCard> = {
  title: '02-Molecules/ai/ProviderCard',
  component: ProviderCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    provider: {
      id: 'gemini-1',
      type: 'gemini',
      name: 'My Gemini key',
      endpoint: 'https://generativelanguage.googleapis.com',
      model: 'gemini-2.5-flash',
      capabilities: { text: true, images: true, streaming: true },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    onSetActive: () => {},
    onValidate: () => {},
    onDelete: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ProviderCard>;

export const Active: Story = { args: { isActive: true } };

export const Inactive: Story = { args: { isActive: false } };

export const Valid: Story = {
  args: {
    isActive: true,
    validation: { valid: true, lastChecked: 1718000000000 },
  },
};

export const Validating: Story = { args: { isActive: true, isValidating: true } };
